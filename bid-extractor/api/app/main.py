from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import documents, health, jobs
from app.settings import settings

app = FastAPI(
    title="Bid Extractor API",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(documents.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
