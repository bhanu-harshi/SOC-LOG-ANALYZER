from datetime import datetime


import logging
import re
from datetime import datetime

logger = logging.getLogger(__name__)

def parse_log_file(file_path: str):
    parsed_events = []
    skipped_lines = 0

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        for line_num, line in enumerate(f, 1):
            raw_line = line.strip()
            if not raw_line:
                continue

            # Try CSV split first
            parts = [p.strip() for p in raw_line.split(",")]

            if len(parts) >= 8:
                timestamp_str = parts[0]
                timestamp_value = None
                try:
                    if 'Z' in timestamp_str:
                        timestamp_value = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                    else:
                        timestamp_value = datetime.fromisoformat(timestamp_str)
                except ValueError:
                    # Try regex for common log formats
                    timestamp_match = re.match(r'(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(Z|\+00:00)?', parts[0])
                    if timestamp_match:
                        ts_str = timestamp_match.group(1)
                        if timestamp_match.group(2) is None:
                            ts_str += '+00:00'
                        timestamp_value = datetime.fromisoformat(ts_str)
                
                event = {
                    "timestamp": timestamp_value,
                    "username": parts[1] if len(parts) > 1 else None,
                    "source_ip": parts[2] if len(parts) > 2 else None,
                    "domain": parts[3] if len(parts) > 3 else None,
                    "url": parts[4] if len(parts) > 4 else None,
                    "action": parts[5] if len(parts) > 5 else None,
                    "status_code": parts[6] if len(parts) > 6 else None,
                    "user_agent": parts[7] if len(parts) > 7 else None,
                    "raw_line": raw_line,
                }
                parsed_events.append(event)
            else:
                skipped_lines += 1

    logger.info(f"Parsed {len(parsed_events)} events from {file_path}, skipped {skipped_lines} lines")
    return parsed_events
