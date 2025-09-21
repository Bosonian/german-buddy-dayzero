"""
German Buddy PWA Backend
"""

import os
import logging
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Environment setup
from dotenv import load_dotenv
load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="German Buddy - PWA Backend",
    description="Backend for the German Buddy PWA",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include SRS + Reading routers
try:
    from .srs import router as srs_router, init_db
    init_db()
    app.include_router(srs_router)
except Exception as e:
    logger.error(f"Failed to init/include SRS router: {e}")

try:
    from .reading import router as reading_router, init_reading_db
    init_reading_db()
    app.include_router(reading_router)
except Exception as e:
    logger.error(f"Failed to init/include Reading router: {e}")

# API Routes
@app.get("/")
async def root():
    return {"message": "German Buddy API", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "srs": "enabled",
            "reading": "enabled"
        }
    }

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8080"))
    logger.info(f"Starting German Buddy API on port {port}")

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
