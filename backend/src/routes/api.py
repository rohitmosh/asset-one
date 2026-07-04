from fastapi import APIRouter
from src.routes import auth, assets, taxonomy, locations, users, reports, audit, snapshots

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(assets.router)
api_router.include_router(taxonomy.router)
api_router.include_router(locations.router)
api_router.include_router(users.router)
api_router.include_router(reports.router)
api_router.include_router(audit.router)
api_router.include_router(snapshots.router)
