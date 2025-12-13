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
    title="German Buddy - PWA Backend + MentorMatch",
    description="Backend for the German Buddy PWA and MentorMatch mentoring platform",
    version="2.0.0"
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

# Include MentorMatch routers
try:
    from .mentormatch_db import init_mentormatch_db
    init_mentormatch_db()
    logger.info("MentorMatch database initialized")
except Exception as e:
    logger.error(f"Failed to init MentorMatch database: {e}")

try:
    from .routers.bookings import router as bookings_router
    app.include_router(bookings_router)
    logger.info("Bookings router included")
except Exception as e:
    logger.error(f"Failed to include Bookings router: {e}")

try:
    from .routers.sessions import router as sessions_router
    app.include_router(sessions_router)
    logger.info("Sessions router included")
except Exception as e:
    logger.error(f"Failed to include Sessions router: {e}")

try:
    from .routers.payments import router as payments_router
    app.include_router(payments_router)
    logger.info("Payments router included")
except Exception as e:
    logger.error(f"Failed to include Payments router: {e}")

try:
    from .routers.reviews import router as reviews_router
    app.include_router(reviews_router)
    logger.info("Reviews router included")
except Exception as e:
    logger.error(f"Failed to include Reviews router: {e}")

try:
    from .routers.mentors import router as mentors_router
    app.include_router(mentors_router)
    logger.info("Mentors router included")
except Exception as e:
    logger.error(f"Failed to include Mentors router: {e}")

try:
    from .routers.categories import router as categories_router
    app.include_router(categories_router)
    logger.info("Categories router included")
except Exception as e:
    logger.error(f"Failed to include Categories router: {e}")

try:
    from .routers.profiles import router as profiles_router
    app.include_router(profiles_router)
    logger.info("Profiles router included")
except Exception as e:
    logger.error(f"Failed to include Profiles router: {e}")

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
            "reading": "enabled",
            "mentormatch": "enabled"
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
