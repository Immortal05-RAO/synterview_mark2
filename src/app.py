import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from src.config import settings
from src.database import init_db
from src.routes import auth_router, interviews_router, health_router
from src.middleware import (
    APIException,
    api_exception_handler,
    http_exception_handler,
    validation_exception_handler,
    unhandled_exception_handler
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("synterview")


# Ensure database tables exist
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Synterview Backend running...")
    yield
    logger.info("Shutting down Synterview Backend...")


app = FastAPI(
    title="Synterview AI Backend API",
    description="REST API for Synterview - Cloud-Ready AI Mock Interview Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = [o.strip() for o in settings.CORS_ORIGIN.split(",") if o.strip()]
if "*" in origins:
    allow_origins = ["*"]
else:
    allow_origins = origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Exception Handlers
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Register Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(interviews_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to Synterview AI Backend API",
        "docs": "/docs",
        "health": "/api/health"
    }
