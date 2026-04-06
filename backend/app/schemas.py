from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UploadResponse(BaseModel):
    message: str
    file_id: int
    filename: str
    parsed_count: int


class LogEventResponse(BaseModel):
    id: int
    timestamp: Optional[str] = None
    username: Optional[str] = None
    source_ip: Optional[str] = None
    domain: Optional[str] = None
    url: Optional[str] = None
    action: Optional[str] = None
    status_code: Optional[str] = None
    user_agent: Optional[str] = None
    raw_line: Optional[str] = None


class AnomalyResponse(BaseModel):
    id: int
    event_id: Optional[int] = None
    anomaly_type: str
    severity: str
    reason: str
    confidence_score: float


class FileResultsResponse(BaseModel):
    file_id: int
    filename: str
    total_events: int
    blocked_requests: int
    unique_source_ips: int
    total_anomalies: int
    ai_summary: str
    normal_observations: str
    recommended_actions: list[str]
    events: list[LogEventResponse]
    anomalies: list[AnomalyResponse]