import os
import json
from dotenv import load_dotenv
import logging
from openai import OpenAI, OpenAIError
# from openai.types.chat import ChatCompletionResponseFormat  # Not needed for OpenAI v1.2+

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")


def generate_fallback_summary(filename, total_events, blocked_requests, unique_source_ips, anomalies):
    if not anomalies:
        return {
            "ai_summary": (
                f"The uploaded log file '{filename}' contains {total_events} total events across "
                f"{unique_source_ips} unique source IPs, with {blocked_requests} blocked requests. "
                f"No major suspicious activity was detected based on the current rule set."
            ),
            "normal_observations": "Traffic consists entirely of expected structural behaviors without distinct signs of exploitation.",
            "recommended_actions": [
                "Continue routine monitoring of network and log activity."
            ]
        }

    high_count = sum(1 for a in anomalies if a["severity"] == "High")
    medium_count = sum(1 for a in anomalies if a["severity"] == "Medium")
    low_count = sum(1 for a in anomalies if a["severity"] == "Low")

    anomaly_types = sorted(set(a["anomaly_type"] for a in anomalies))
    joined_types = ", ".join(anomaly_types)

    return {
        "ai_summary": (
            f"The uploaded log file '{filename}' contains {total_events} total events across "
            f"{unique_source_ips} unique source IPs, including {blocked_requests} blocked requests. "
            f"The analysis identified {len(anomalies)} anomalous findings, including {joined_types}. "
            f"Severity distribution is {high_count} high, {medium_count} medium, and {low_count} low. "
            f"This may indicate suspicious outbound communication, repeated blocked access attempts, "
            f"or abnormal traffic behavior that should be reviewed by a SOC analyst."
        ),
        "normal_observations": "Benign web traffic was noted alongside these anomalies but isolated by detection rules.",
        "recommended_actions": [
            "Investigate suspicious source IPs with repeated blocked activity.",
            "Review access to suspicious domains for possible phishing or malware behavior.",
            "Validate whether high-volume request patterns indicate scanning or automation."
        ]
    }


def generate_llm_summary(filename, total_events, blocked_requests, unique_source_ips, anomalies):
    if not OPENAI_API_KEY:
        return generate_fallback_summary(
            filename, total_events, blocked_requests, unique_source_ips, anomalies
        )

    client = OpenAI(api_key=OPENAI_API_KEY)

    prompt_data = {
        "filename": filename,
        "total_events": total_events,
        "blocked_requests": blocked_requests,
        "unique_source_ips": unique_source_ips,
        "anomalies": anomalies,
    }

    system_prompt = (
        "You are a Tier 3 Senior SOC Analyst and Threat Intelligence Expert. "
        "Analyze the structured log findings deeply and provide a highly detailed, comprehensive incident summary adhering STRICTLY to these rules: "
        "1. Detect all meaningful anomalies present in the batch. "
        "2. Do not duplicate the same anomaly unnecessarily. "
        "3. Group related repeated events into one anomaly when appropriate. "
        "4. Keep single-event anomalies separate if they represent a distinct risk. "
        "5. Mention benign traffic separately in normal_observations. "
        "6. If all suspicious requests were blocked, explicitly state that in the summary. "
        "7. If there is not enough evidence for major attack claims, say that clearly. "
        "8. Be consistent and conservative."
    )

    user_prompt = f"""
Given the following structured log analysis findings, produce JSON with this exact structure:
{{
  "ai_summary": "A highly detailed, multi-paragraph technical summary of the events, anomalies, potential threat vectors, and an assessment of the overall risk level.",
  "normal_observations": "A paragraph specifically noting any benign or safe traffic observed in the logs.",
  "recommended_actions": ["detailed technical action 1", "detailed technical action 2", "detailed technical action 3", "detailed technical action 4"]
}}

Findings:
{json.dumps(prompt_data, indent=2)}
"""

    logger = logging.getLogger(__name__)

    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            temperature=0.2,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt + "\nRespond only with valid JSON matching the requested schema."},
                {"role": "user", "content": user_prompt},
            ],
        )

        content = response.choices[0].message.content
        parsed = json.loads(content)

        logger.info("LLM summary generated successfully")
        return {
            "ai_summary": parsed.get("ai_summary", "No summary generated."),
            "normal_observations": parsed.get("normal_observations", "No distinct normal observations cited."),
            "recommended_actions": parsed.get("recommended_actions", []),
        }

    except (json.JSONDecodeError, OpenAIError) as e:
        logger.error(f"LLM error: {str(e)}")
        return generate_fallback_summary(
            filename, total_events, blocked_requests, unique_source_ips, anomalies
        )
    except Exception as e:
        logger.error(f"Unexpected LLM error: {str(e)}")
        return generate_fallback_summary(
            filename, total_events, blocked_requests, unique_source_ips, anomalies
        )
