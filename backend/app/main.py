from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db_manager
from app.services.seeder import seed_database
from app.routers import (
    auth,
    telemetry,
    billing,
    complaints,
    appointments,
    admin,
    notifications,
    reports,
    meetings,
    smartgrid
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB and seed default records
    await db_manager.connect()
    await seed_database(db_manager.db)
    yield
    # Shutdown: Close database connection
    await db_manager.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="GridPulse: Urban Smart Electricity Consumer Assistance & Energy Monitoring Backend API",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(billing.router, prefix=settings.API_V1_STR)
app.include_router(complaints.router, prefix=settings.API_V1_STR)
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(meetings.router, prefix=settings.API_V1_STR)
app.include_router(smartgrid.router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "project": "GridPulse",
        "description": "Urban Smart Electricity Consumer Assistance & Energy Monitoring System",
        "status": "online",
        "database": "Live MongoDB" if db_manager.is_connected_to_real_mongo else "Resilient Async In-Memory MongoDB Store",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database_connected": True,
        "is_real_mongo": db_manager.is_connected_to_real_mongo,
        "version": settings.VERSION
    }
