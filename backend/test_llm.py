import asyncio
from app.utils.summarizer import generate_llm_summary

test_anom = [{"anomaly_type": "Data Exfiltration", "severity": "High", "reason": "Too much data", "confidence_score": 0.9}]
res = generate_llm_summary("test.log", 100, 5, 2, test_anom)
print("Result:", res)