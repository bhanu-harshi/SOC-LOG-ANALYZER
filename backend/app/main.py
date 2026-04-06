import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from . import models
from .routes.auth_routes import router as auth_router
from .routes.log_routes import router as log_router

logging.basicConfig(level=logging.INFO)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
logger = logging.getLogger("soc_log_analyzer")

app = FastAPI(
    title="SOC Log Analyzer API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(log_router)


@app.get("/")
def root():
    return {"message": "SOC Log Analyzer API is running"}


@app.get("/health")
def health_check():
    return {"message": "Backend is running"}