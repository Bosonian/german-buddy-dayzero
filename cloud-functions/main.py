"""
German Buddy - Cloud Functions Backend
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import hashlib
import jwt
# from fsrs import Scheduler, Card, Rating  # Temporarily disabled for deployment
from proficiency_classifier import get_proficiency_level

# Import Functions Framework
import functions_framework
from flask import Request, Response, jsonify
from flask_cors import cross_origin

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# In-memory storage for demo (use Cloud SQL or Firestore in production)
users_db = {}
reviews_db = []
items_db = []
user_srs_db = {}  # user_email -> {item_id -> {stability, difficulty, due, last_reviewed}}
daily_progress_db = {}  # user_email -> {date -> {learned_items: set, completed: bool}}

# High-frequency German collocations from frequency analysis
SAMPLE_ITEMS = [
    {"id": 1, "german": "ich möchte", "english": "I would like", "frequency": 942, "pattern": "ich_moechte", "source": "Verben_mit_Prpositionen_und_Be"},
    {"id": 2, "german": "ist ein", "english": "is a", "frequency": 883, "pattern": "sein_adj", "source": "100k_German_sentences_with_aud"},
    {"id": 3, "german": "ist nicht", "english": "is not", "frequency": 778, "pattern": "sein_adj", "source": "100k_German_sentences_with_aud"},
    {"id": 4, "german": "nicht mehr", "english": "no more", "frequency": 764, "pattern": "nicht_mehr", "source": "Verben_mit_Prpositionen_und_Be"},
    {"id": 5, "german": "es gibt", "english": "there is/there are", "frequency": 652, "pattern": "es_gibt", "source": "100k_German_sentences_with_aud"},
    {"id": 6, "german": "ich habe", "english": "I have", "frequency": 598, "pattern": "ich_habe", "source": "100k_German_sentences_with_aud"},
    {"id": 7, "german": "sie haben", "english": "they have/you have", "frequency": 567, "pattern": "sie_haben", "source": "100k_German_sentences_with_aud"},
    {"id": 8, "german": "ich bin", "english": "I am", "frequency": 534, "pattern": "ich_bin", "source": "100k_German_sentences_with_aud"},
    {"id": 9, "german": "das ist", "english": "that is", "frequency": 498, "pattern": "das_ist", "source": "100k_German_sentences_with_aud"},
    {"id": 10, "german": "wir haben", "english": "we have", "frequency": 467, "pattern": "wir_haben", "source": "100k_German_sentences_with_aud"},
]

# Add proficiency levels to items
for item in SAMPLE_ITEMS:
    item['level'] = get_proficiency_level(item)

def init_sample_data():
    """Initialize sample data if items_db is empty"""
    global items_db
    if not items_db:
        items_db = SAMPLE_ITEMS.copy()
        logger.info(f"Initialized {len(items_db)} sample German items")

def create_jwt_token(user_email: str) -> str:
    """Create JWT token for user"""
    payload = {
        'email': user_email,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.utcnow()
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> Optional[str]:
    """Verify JWT token and return user email"""
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get('email')
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid JWT token")
        return None

def hash_password(password: str) -> str:
    """Simple password hashing"""
    return hashlib.sha256(password.encode()).hexdigest()

def simple_schedule(user_email: str, item_id: int, rating: int) -> Dict[str, Any]:
    """Simple scheduling fallback without FSRS"""
    # Simple interval mapping based on rating
    intervals = {1: 1, 2: 2, 3: 3, 4: 7}  # days
    interval = intervals.get(rating, 3)

    return {
        'stability': 1.0,
        'difficulty': 5.0,
        'due': (datetime.utcnow() + timedelta(days=interval)).isoformat(),
        'last_reviewed': datetime.utcnow().isoformat()
    }

def get_today_string() -> str:
    """Get today's date as string for daily progress tracking"""
    return datetime.utcnow().strftime('%Y-%m-%d')

def get_daily_progress(user_email: str) -> Dict[str, Any]:
    """Get user's daily progress"""
    today = get_today_string()

    if user_email not in daily_progress_db:
        daily_progress_db[user_email] = {}

    if today not in daily_progress_db[user_email]:
        daily_progress_db[user_email][today] = {
            'learned_items': set(),
            'completed': False
        }

    progress = daily_progress_db[user_email][today]
    return {
        'learned_count': len(progress['learned_items']),
        'target_count': 5,
        'completed': progress['completed'],
        'learned_items': list(progress['learned_items'])
    }

def add_learned_item(user_email: str, item_id: int) -> Dict[str, Any]:
    """Add an item to user's daily learned items"""
    today = get_today_string()

    if user_email not in daily_progress_db:
        daily_progress_db[user_email] = {}

    if today not in daily_progress_db[user_email]:
        daily_progress_db[user_email][today] = {
            'learned_items': set(),
            'completed': False
        }

    progress = daily_progress_db[user_email][today]
    progress['learned_items'].add(item_id)

    # Check if daily target is reached
    if len(progress['learned_items']) >= 5:
        progress['completed'] = True
        logger.info(f"User {user_email} completed daily learning target!")

    return get_daily_progress(user_email)

@functions_framework.http
@cross_origin()
def german_buddy_api(request: Request) -> Response:
    """Main Cloud Function entry point"""

    # Initialize sample data
    init_sample_data()

    # Handle preflight OPTIONS requests
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '3600'
        }
        return Response('', 204, headers)

    # Parse request path
    path = request.path
    method = request.method

    logger.info(f"Processing {method} {path}")

    try:
        # Route requests
        if path == '/' or path == '/health':
            return jsonify({
                "message": "German Buddy API",
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat(),
                "items_count": len(items_db)
            })

        elif path == '/auth/signup' and method == 'POST':
            return handle_signup(request)

        elif path == '/auth/login' and method == 'POST':
            return handle_login(request)

        elif path == '/me' and method == 'GET':
            return handle_me(request)

        elif path == '/pwa/exercises' and method == 'GET':
            return handle_exercises(request)

        elif path == '/pwa/review' and method == 'POST':
            return handle_review(request)

        elif path == '/srs/items/import' and method == 'POST':
            return handle_import_items(request)

        elif path == '/proficiency/levels' and method == 'GET':
            return handle_proficiency_levels(request)

        elif path == '/daily/progress' and method == 'GET':
            return handle_daily_progress(request)

        else:
            return jsonify({"error": "Not found"}), 404

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"error": "Internal server error"}), 500

def handle_signup(request: Request) -> Response:
    """Handle user signup"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    proficiency_level = data.get('proficiency_level', 'A1')  # Default to beginner

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if email in users_db:
        return jsonify({"error": "User already exists"}), 400

    # Validate proficiency level
    valid_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if proficiency_level not in valid_levels:
        proficiency_level = 'A1'

    # Store user with proficiency level
    users_db[email] = {
        "email": email,
        "password": hash_password(password),
        "proficiency_level": proficiency_level,
        "created_at": datetime.utcnow().isoformat()
    }

    # Create token
    token = create_jwt_token(email)

    return jsonify({
        "access_token": token,
        "token_type": "bearer"
    })

def handle_login(request: Request) -> Response:
    """Handle user login"""
    # Handle form data (like FastAPI form)
    if request.content_type == 'application/x-www-form-urlencoded':
        email = request.form.get('username')  # FastAPI uses 'username' field
        password = request.form.get('password')
    else:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = users_db.get(email)
    if not user or user['password'] != hash_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    # Create token
    token = create_jwt_token(email)

    return jsonify({
        "access_token": token,
        "token_type": "bearer"
    })

def handle_me(request: Request) -> Response:
    """Handle get current user"""
    auth_header = request.headers.get('Authorization', '')
    user_email = verify_jwt_token(auth_header)

    if not user_email:
        return jsonify({"error": "Invalid or missing token"}), 401

    user = users_db.get(user_email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "email": user_email,
        "created_at": user.get('created_at')
    })

def handle_exercises(request: Request) -> Response:
    """Handle get exercises"""
    auth_header = request.headers.get('Authorization', '')
    user_email = verify_jwt_token(auth_header)

    if not user_email:
        return jsonify({"error": "Invalid or missing token"}), 401

    # Get daily progress
    daily_progress = get_daily_progress(user_email)

    # Get query parameters
    limit = int(request.args.get('limit', 10))
    level = request.args.get('level', None)  # Optional proficiency filter

    # Filter by level if specified
    filtered_items = items_db
    if level:
        filtered_items = [item for item in items_db if item.get('level') == level.upper()]

    # Filter out items already learned today
    learned_today = set(daily_progress['learned_items'])
    available_items = [item for item in filtered_items if item['id'] not in learned_today]

    # If daily quota is completed, return empty with progress info
    if daily_progress['completed']:
        logger.info(f"User {user_email} has completed daily quota ({daily_progress['learned_count']}/5)")
        return jsonify({
            "exercises": [],
            "daily_progress": daily_progress,
            "message": "Daily learning quota completed! Come back tomorrow for more phrases."
        })

    # Sort by frequency descending (Pareto Principle - highest impact first)
    sorted_items = sorted(available_items, key=lambda x: x.get('frequency', 0), reverse=True)

    # Limit to remaining items needed for daily quota
    remaining_needed = 5 - daily_progress['learned_count']
    result = sorted_items[:min(limit, remaining_needed)]

    logger.info(f"Returning {len(result)} exercises for level {level or 'all'}, progress: {daily_progress['learned_count']}/5")
    return jsonify({
        "exercises": result,
        "daily_progress": daily_progress
    })

def handle_review(request: Request) -> Response:
    """Handle submit review"""
    auth_header = request.headers.get('Authorization', '')
    user_email = verify_jwt_token(auth_header)

    if not user_email:
        return jsonify({"error": "Invalid or missing token"}), 401

    data = request.get_json()
    item_id = data.get('item_id')
    rating = data.get('rating')

    if not item_id or rating is None:
        return jsonify({"error": "item_id and rating required"}), 400

    if rating not in [1, 2, 3]:  # Hard, Medium, Easy (traffic light system)
        return jsonify({"error": "rating must be 1-3 (Hard/Medium/Easy)"}), 400

    # Apply FSRS scheduling
    try:
        fsrs_result = simple_schedule(user_email, item_id, rating)

        # Store review
        review = {
            "user_email": user_email,
            "item_id": item_id,
            "rating": rating,
            "timestamp": datetime.utcnow().isoformat(),
            "fsrs_data": fsrs_result
        }
        reviews_db.append(review)

        # Add to daily progress only if rating is "Easy" (3)
        daily_progress = None
        if rating == 3:  # Only "Easy" counts as learned in traffic light system
            daily_progress = add_learned_item(user_email, item_id)
            logger.info(f"Added item {item_id} to daily progress for user {user_email} (marked as Easy)")

        logger.info(f"FSRS review: user={user_email}, item={item_id}, rating={rating}, stability={fsrs_result['stability']:.2f}")

        response_data = {
            "message": "Review processed with FSRS",
            "fsrs_data": fsrs_result,
            "ok": True
        }

        if daily_progress:
            response_data["daily_progress"] = daily_progress

        return jsonify(response_data)
    except Exception as e:
        logger.error(f"FSRS scheduling error: {e}")
        return jsonify({"error": "Failed to process review"}), 500

def handle_proficiency_levels(request: Request) -> Response:
    """Return available proficiency levels and their descriptions"""
    levels = {
        "A1": {
            "name": "Beginner",
            "description": "Can understand and use familiar everyday expressions",
            "frequency_range": "800+",
            "example_count": sum(1 for item in items_db if item.get('level') == 'A1')
        },
        "A2": {
            "name": "Elementary",
            "description": "Can communicate in simple and routine tasks",
            "frequency_range": "500-799",
            "example_count": sum(1 for item in items_db if item.get('level') == 'A2')
        },
        "B1": {
            "name": "Intermediate",
            "description": "Can deal with most situations while traveling",
            "frequency_range": "200-499",
            "example_count": sum(1 for item in items_db if item.get('level') == 'B1')
        },
        "B2": {
            "name": "Upper Intermediate",
            "description": "Can interact with native speakers fluently",
            "frequency_range": "100-199",
            "example_count": sum(1 for item in items_db if item.get('level') == 'B2')
        },
        "C1": {
            "name": "Advanced",
            "description": "Can use language flexibly for social and professional purposes",
            "frequency_range": "50-99",
            "example_count": sum(1 for item in items_db if item.get('level') == 'C1')
        },
        "C2": {
            "name": "Proficient",
            "description": "Can understand virtually everything heard or read",
            "frequency_range": "0-49",
            "example_count": sum(1 for item in items_db if item.get('level') == 'C2')
        }
    }
    return jsonify(levels)

def handle_daily_progress(request: Request) -> Response:
    """Handle get daily progress"""
    auth_header = request.headers.get('Authorization', '')
    user_email = verify_jwt_token(auth_header)

    if not user_email:
        return jsonify({"error": "Invalid or missing token"}), 401

    daily_progress = get_daily_progress(user_email)
    return jsonify(daily_progress)

def handle_import_items(request: Request) -> Response:
    """Handle import items (admin only)"""
    auth_header = request.headers.get('Authorization', '')
    user_email = verify_jwt_token(auth_header)

    if not user_email:
        return jsonify({"error": "Invalid or missing token"}), 401

    data = request.get_json()
    if not isinstance(data, list):
        return jsonify({"error": "Expected list of items"}), 400

    # Add items to database
    inserted = 0
    for item in data:
        if all(key in item for key in ['id', 'german', 'english']):
            # Check if item already exists
            if not any(existing['id'] == item['id'] for existing in items_db):
                items_db.append(item)
                inserted += 1

    logger.info(f"Imported {inserted} new items")
    return jsonify({"inserted": inserted, "total": len(items_db)})