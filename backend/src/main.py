from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.database.connection import engine, Base
from src.database.triggers import init_audit_triggers
from src.routes.api import api_router
from src.config.config import settings

app = FastAPI(
    title="OHPC Enterprise Asset Management System (EAMS) API",
    description="Backend API for managing OHPC Digital Assets, Ownership, Lifecycles, and Auditing",
    version=settings.VERSION,
    openapi_url=None,
    docs_url=None,
    redoc_url=None
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo phase; configure strictly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Make sure tables and SQLite rules/triggers exist
    Base.metadata.create_all(bind=engine)
    init_audit_triggers(engine)

# Mount all routes under /api
app.include_router(api_router, prefix="/api")
