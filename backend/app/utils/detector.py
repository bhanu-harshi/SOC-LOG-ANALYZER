import logging
from collections import Counter
import re

logger = logging.getLogger(__name__)

# Configurable thresholds
HIGH_VOLUME_THRESHOLD = 5
BLOCKED_THRESHOLD = 3

# Zscaler NSS Threat Dictionaries
ZSCALER_CRITICAL_THREATS = [
    r"sandbox malware", r"spyware callback", r"\btrojan\b", r"\bbotnet\b", 
    r"advanced threat category", r"virus", r"exploit"
]

ZSCALER_PRIVACY_RISKS = [
    r"privacy risk", r"sandbox anonymizer", r"\badware\b", r"sandbox adware", r"unverified browser"
]

ZSCALER_SANDBOX_ALERTS = [
    r"sent for analysis", r"submitted to sandbox", r"awaiting verdict"
]

def scan_zscaler_threats(raw_line: str, event_id: int):
    """
    Performs deep packet substring inspection against the raw log line 
    to map explicit enterprise Zscaler threats.
    """
    if not raw_line:
        return None

    line_lower = raw_line.lower()

    # 1. Critical Threats
    for pattern in ZSCALER_CRITICAL_THREATS:
        if re.search(pattern, line_lower):
            matched = pattern.replace(r"\b", "")
            return {
                "event_id": event_id,
                "anomaly_type": "Critical Malware Pipeline",
                "severity": "High",
                "reason": f"Enterprise DPI flagged signature associated with: {matched.title()}.",
                "confidence_score": 0.99
            }

    # 2. Privacy & Policy Risks
    for pattern in ZSCALER_PRIVACY_RISKS:
        if re.search(pattern, line_lower):
            matched = pattern.replace(r"\b", "")
            return {
                "event_id": event_id,
                "anomaly_type": "Privacy & Policy Violation",
                "severity": "Medium",
                "reason": f"Activity mapped to privacy risk or anonymizer usage: {matched.title()}.",
                "confidence_score": 0.85
            }

    # 3. Sandbox Detainments
    for pattern in ZSCALER_SANDBOX_ALERTS:
        if re.search(pattern, line_lower):
            return {
                "event_id": event_id,
                "anomaly_type": "Zero-Day Sandbox Evaluation",
                "severity": "Low",
                "reason": "Payload was intercepted and forwarded to dynamic sandbox environment for deep behavioral analysis.",
                "confidence_score": 0.70
            }

    return None

def detect_anomalies(events):
    if not events:
        logger.info("No events to analyze for anomalies")
        return []

    anomalies = []
    ip_counts = Counter()
    blocked_ip_counts = Counter()
    status_403_counts = Counter()

    for event in events:
        source_ip = getattr(event, 'source_ip', None)
        action = getattr(event, 'action', None)
        status = getattr(event, 'status_code', None)

        if source_ip:
            ip_counts[source_ip] += 1

        if source_ip and action and action.lower() == "blocked":
            blocked_ip_counts[source_ip] += 1
            
        if source_ip and status and str(status) == "403":
            status_403_counts[source_ip] += 1

    for event in events:
        source_ip = getattr(event, 'source_ip', None)
        event_id = getattr(event, 'id', None)
        raw_line = getattr(event, 'raw_line', "")

        # ----------------------------------------------------
        # 1. ZSCALER DEEP PACKET THREAT MAPPING 
        # ----------------------------------------------------
        zscaler_threat = scan_zscaler_threats(raw_line, event_id)
        if zscaler_threat:
            threat_type = zscaler_threat["anomaly_type"]
            # To prevent duplication, check if this source_ip already triggered this specific threat type
            existing_threat = next((a for a in anomalies if a["anomaly_type"] == threat_type and f"IP {source_ip}" in a["reason"]), None)
            
            if not existing_threat:
                zscaler_threat["reason"] += f" Originating IP {source_ip}."
                anomalies.append(zscaler_threat)
            continue # If Zscaler flags it deterministically, skip lower tier heuristics for this exact event

        # ----------------------------------------------------
        # 2. HEURISTIC HIGH VOLUME / BEHAVIORAL
        # ----------------------------------------------------
        # High Request Volume
        if source_ip and ip_counts[source_ip] > HIGH_VOLUME_THRESHOLD:
            # Check if this IP isn't already logged for high volume
            if not any(a["anomaly_type"] == "High Request Volume" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                anomalies.append({
                    "event_id": event_id,
                    "anomaly_type": "High Request Volume",
                    "severity": "High",
                    "reason": f"Source IP {source_ip} generated unusually high request volume ({ip_counts[source_ip]} requests > threshold {HIGH_VOLUME_THRESHOLD}).",
                    "confidence_score": 0.92
                })

        # Hyper-Correlated HTTP 403 Blocking 
        if source_ip and blocked_ip_counts[source_ip] > BLOCKED_THRESHOLD and status_403_counts[source_ip] > 0:
            if not any(a["anomaly_type"] == "Sustained blocked traffic" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                anomalies.append({
                    "event_id": event_id,
                    "anomaly_type": "Sustained blocked traffic",
                    "severity": "Medium",
                    "reason": f"Repeated 403/blocked activity from the same IP {source_ip} in a short time window strongly suggests probing or repeated unauthorized attempts. ({blocked_ip_counts[source_ip]} blocked events).",
                    "confidence_score": 0.88
                })

        # ----------------------------------------------------
        # 3. DOMAIN & IDENTITY BEHAVIORAL HEURISTICS
        # ----------------------------------------------------
        domain = getattr(event, 'domain', "")
        username = getattr(event, 'username', "")
        
        domain_lower = domain.lower() if domain else ""
        username_lower = username.lower() if username else ""
        action_lower = action.lower() if action else ""

        # Generalized Suspicious Keywords in Domain
        SUSPICIOUS_DOMAIN_KEYWORDS = [
            "phish", "malware", "malicious", "suspicious", "botnet", 
            "crypto", "miner", "hack", "exploit", "c2", "command"
        ]
        
        # Generalized Abused TLDs
        ABUSED_TLDS = [
            ".xyz", ".top", ".pw", ".tk", ".ml", ".ga", ".cf", ".gq", ".zip", ".review", ".country", ".kim", ".party", ".gdn"
        ]

        # Phishing / High-Risk Domain Keyword Access
        matched_keyword = next((kw for kw in SUSPICIOUS_DOMAIN_KEYWORDS if kw in domain_lower), None)
        if matched_keyword and action_lower == "blocked":
            if username_lower in ["unknown", "anonymous", "null", "none", "-"]:
                if not any(a["anomaly_type"] == "Suspicious domain access" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                    anomalies.append({
                        "event_id": event_id,
                        "anomaly_type": "Suspicious domain access",
                        "severity": "High",
                        "reason": f"Domain containing high-risk keyword '{matched_keyword}' ({domain}), blocked request, and unauthenticated/unknown user make this a strong anomaly from IP {source_ip}.",
                        "confidence_score": 0.96
                    })
            else:
                if not any(a["anomaly_type"] == f"High-risk domain access: {matched_keyword}" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                    anomalies.append({
                        "event_id": event_id,
                        "anomaly_type": f"High-risk domain access: {matched_keyword}",
                        "severity": "High",
                        "reason": f"The domain {domain} was flagged due to the high-risk substring '{matched_keyword}' and access was blocked from IP {source_ip}.",
                        "confidence_score": 0.90
                    })

        # Unknown user activity performing blocked actions
        if username_lower in ["unknown", "anonymous", "null", "none", "-"] and action_lower == "blocked":
            # Prevent triggering if already caught by the stronger domain rule
            if not any(a["anomaly_type"] == "Suspicious domain access" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                if not any(a["anomaly_type"] == "Unknown user activity" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                    anomalies.append({
                        "event_id": event_id,
                        "anomaly_type": "Unknown user activity",
                        "severity": "Medium",
                        "reason": f"Unidentified identity performing blocked access is suspicious and should be highlighted. IP: {source_ip}.",
                        "confidence_score": 0.85
                    })

        # Suspicious domain / uncommon TLD access
        matched_tld = next((tld for tld in ABUSED_TLDS if domain_lower.endswith(tld)), None)
        if matched_tld and action_lower == "blocked":
            if not any(a["anomaly_type"] == "Suspicious domain / uncommon TLD access" and f"IP {source_ip}" in a["reason"] for a in anomalies):
                anomalies.append({
                    "event_id": event_id,
                    "anomaly_type": "Suspicious domain / uncommon TLD access",
                    "severity": "Medium",
                    "reason": f"Blocked request to a domain utilizing an extensively abused TLD ({matched_tld}) is worth flagging as suspicious. Domain: {domain}, IP: {source_ip}.",
                    "confidence_score": 0.82
                })

    return anomalies