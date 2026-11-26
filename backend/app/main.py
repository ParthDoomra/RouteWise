"""RouteWise FastAPI Backend Application."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # Ensures all models are registered with Base.metadata
from app.database import Base, engine
from app.routers import (
    auth_router,
    driver_router,
    maintenance_router,
    notifications_router,
    orders_router,
    routes_router,
    simulator_router,
    tracking_router,
    vehicles_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context: create database tables on startup, run migrations, and start background simulator."""
    import asyncio
    from app.database import SessionLocal
    from app.services.maintenance import run_maintenance_sweep
    from app.services.simulator import simulator

    Base.metadata.create_all(bind=engine)
    # Safe migration for existing tables
    from sqlalchemy import text
    with engine.begin() as conn:
        for sql in [
            "ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_service_mileage_km NUMERIC(10, 2) DEFAULT 0.0;",
            "UPDATE vehicles SET last_service_mileage_km = mileage_km WHERE last_service_mileage_km IS NULL;",
        ]:
            try:
                conn.execute(text(sql))
            except Exception:
                pass

    # Run maintenance check sweep over all vehicles on startup
    sweep_db = SessionLocal()
    try:
        run_maintenance_sweep(sweep_db)
    except Exception:
        pass
    finally:
        sweep_db.close()

    # Start vehicle position simulator background loop
    sim_task = asyncio.create_task(simulator.run_loop())

    yield

    simulator.shutdown()
    sim_task.cancel()


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

# Register routers (accessible at root and /api for architectural consistency)
core_routers = [
    auth_router,
    orders_router,
    vehicles_router,
    maintenance_router,
    notifications_router,
    routes_router,
    driver_router,
    tracking_router,
    simulator_router,
]

for r in core_routers:
    app.include_router(r)
    app.include_router(r, prefix="/api")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/health")
def api_health_check():
    """API health check endpoint."""
    return {"status": "ok"}
