"""RouteWise FastAPI Backend Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # Ensures all models are registered with Base.metadata
from app.database import Base, engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="RouteWise Backend API",
    description="Smart Fleet & Delivery Route Optimization API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health")
def api_health_check():
    """API health check endpoint."""
    return {"status": "ok"}
