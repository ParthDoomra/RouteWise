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
    from app.services.delay_notification_service import delay_detector_service
    from app.services.maintenance import run_maintenance_sweep
    from app.services.simulator import simulator

    Base.metadata.create_all(bind=engine)
    # Safe migration for existing tables
    from sqlalchemy import text
    with engine.begin() as conn:
        for sql in [
            "ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS original_eta TIMESTAMP;",
            "UPDATE route_stops SET original_eta = eta WHERE original_eta IS NULL AND eta IS NOT NULL;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone VARCHAR(100);",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS latest_delay_message TEXT;",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS generation_source VARCHAR(20) DEFAULT 'template';",
            "ALTER TABLE notifications ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'simulated';",
            """
            UPDATE orders
            SET zone = CASE
                WHEN drop_address ILIKE '%HSR Layout%' THEN 'HSR Layout'
                WHEN drop_address ILIKE '%MG Road%' THEN 'MG Road'
                WHEN drop_address ILIKE '%Jayanagar%' THEN 'Jayanagar'
                WHEN drop_address ILIKE '%BTM Layout%' THEN 'BTM Layout'
                WHEN drop_address ILIKE '%Malleshwaram%' THEN 'Malleshwaram'
                WHEN drop_address ILIKE '%Frazer Town%' THEN 'Frazer Town'
                WHEN drop_address ILIKE '%Bellandur%' THEN 'Bellandur'
                WHEN drop_address ILIKE '%JP Nagar%' THEN 'JP Nagar'
                WHEN drop_address ILIKE '%Hoodi%' THEN 'Hoodi'
                WHEN drop_address ILIKE '%Indiranagar%' THEN 'Indiranagar'
                WHEN drop_address ILIKE '%Whitefield%' THEN 'Whitefield'
                WHEN drop_address ILIKE '%Koramangala%' THEN 'Koramangala'
                ELSE 'Central Bengaluru'
            END
            WHERE zone IS NULL OR zone = '';
            """,
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

    # Start background loops
    sim_task = asyncio.create_task(simulator.run_loop())
    delay_task = asyncio.create_task(delay_detector_service.run_loop())

    yield

    delay_detector_service.shutdown()
    delay_task.cancel()
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
