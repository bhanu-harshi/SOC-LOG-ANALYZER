from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
import shutil
import uuid

from ..database import get_db
from ..deps import get_current_user
from ..models import UploadedFile, LogEvent, Anomaly
from ..schemas import (
    UploadResponse,
    FileResultsResponse,
    LogEventResponse,
    AnomalyResponse,
)
from ..utils.parser import parse_log_file
from ..utils.detector import detect_anomalies
from ..utils.summarizer import generate_llm_summary

router = APIRouter(prefix="/logs", tags=["Logs"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
def upload_log(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is missing")

    if not file.filename.endswith((".log", ".txt")):
        raise HTTPException(status_code=400, detail="Only .log and .txt files are allowed")

    safe_name = f"{uuid.uuid4()}_{file.filename}"
    file_path = UPLOAD_DIR / safe_name

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    uploaded = UploadedFile(
        filename=file.filename,
        stored_path=str(file_path),
        uploaded_by=current_user["user_id"]
    )
    db.add(uploaded)
    db.commit()
    db.refresh(uploaded)

    parsed_events = parse_log_file(str(file_path))

    for event in parsed_events:
        log_event = LogEvent(
            file_id=uploaded.id,
            timestamp=event["timestamp"],
            username=event["username"],
            source_ip=event["source_ip"],
            domain=event["domain"],
            url=event["url"],
            action=event["action"],
            status_code=event["status_code"],
            user_agent=event["user_agent"],
            raw_line=event["raw_line"]
        )
        db.add(log_event)

    db.commit()

    stored_events = db.query(LogEvent).filter(LogEvent.file_id == uploaded.id).all()
    detected_anomalies = detect_anomalies(stored_events)

    for anomaly in detected_anomalies:
        anomaly_row = Anomaly(
            file_id=uploaded.id,
            event_id=anomaly["event_id"],
            anomaly_type=anomaly["anomaly_type"],
            severity=anomaly["severity"],
            reason=anomaly["reason"],
            confidence_score=anomaly["confidence_score"]
        )
        db.add(anomaly_row)

    db.commit()

    return UploadResponse(
        message="File uploaded and parsed successfully",
        file_id=uploaded.id,
        filename=uploaded.filename,
        parsed_count=len(parsed_events)
    )


@router.get("/{file_id}/results", response_model=FileResultsResponse)
def get_file_results(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()

    if not uploaded_file:
        raise HTTPException(status_code=404, detail="File not found")

    events = db.query(LogEvent).filter(LogEvent.file_id == file_id).all()
    anomalies = db.query(Anomaly).filter(Anomaly.file_id == file_id).all()

    blocked_requests = sum(
        1 for event in events
        if event.action and event.action.lower() == "blocked"
    )
    unique_source_ips = len({event.source_ip for event in events if event.source_ip})

    anomaly_payload = [
        {
            "id": anomaly.id,
            "event_id": anomaly.event_id,
            "anomaly_type": anomaly.anomaly_type,
            "severity": anomaly.severity,
            "reason": anomaly.reason,
            "confidence_score": anomaly.confidence_score,
        }
        for anomaly in anomalies
    ]

    llm_output = generate_llm_summary(
        filename=uploaded_file.filename,
        total_events=len(events),
        blocked_requests=blocked_requests,
        unique_source_ips=unique_source_ips,
        anomalies=anomaly_payload
    )

    event_list = [
        LogEventResponse(
            id=event.id,
            timestamp=event.timestamp.isoformat() if event.timestamp else None,
            username=event.username,
            source_ip=event.source_ip,
            domain=event.domain,
            url=event.url,
            action=event.action,
            status_code=event.status_code,
            user_agent=event.user_agent,
            raw_line=event.raw_line,
        )
        for event in events
    ]

    anomaly_list = [
        AnomalyResponse(
            id=anomaly["id"],
            event_id=anomaly["event_id"],
            anomaly_type=anomaly["anomaly_type"],
            severity=anomaly["severity"],
            reason=anomaly["reason"],
            confidence_score=anomaly["confidence_score"],
        )
        for anomaly in anomaly_payload
    ]

    return FileResultsResponse(
        file_id=uploaded_file.id,
        filename=uploaded_file.filename,
        total_events=len(events),
        blocked_requests=blocked_requests,
        unique_source_ips=unique_source_ips,
        total_anomalies=len(anomalies),
        ai_summary=llm_output["ai_summary"],
        normal_observations=llm_output.get("normal_observations", "No distinct normal observations cited."),
        recommended_actions=llm_output["recommended_actions"],
        events=event_list,
        anomalies=anomaly_list
    )