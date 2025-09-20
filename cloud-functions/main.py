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

# Sample German phrases for demo
SAMPLE_ITEMS = [
    {"id": 1, "german": "Guten Tag", "english": "Good day", "level": "A1", "frequency": 1000},
    {"id": 2, "german": "Wie geht es dir?", "english": "How are you?", "level": "A1", "frequency": 950},
    {"id": 3, "german": "Danke schön", "english": "Thank you very much", "level": "A1", "frequency": 900},
    {"id": 4, "german": "Entschuldigung", "english": "Excuse me", "level": "A1", "frequency": 850},
    {"id": 5, "german": "Ich verstehe nicht", "english": "I don't understand", "level": "A1", "frequency": 800},
    {"id": 6, "german": "Sprechen Sie Englisch?", "english": "Do you speak English?", "level": "A1", "frequency": 750},
    {"id": 7, "german": "Wo ist der Bahnhof?", "english": "Where is the train station?", "level": "A2", "frequency": 700},
    {"id": 8, "german": "Ich möchte einen Kaffee", "english": "I would like a coffee", "level": "A2", "frequency": 650},
    {"id": 9, "german": "Auf Wiedersehen", "english": "Goodbye", "level": "A1", "frequency": 600},
    {"id": 10, "german": "Es tut mir leid", "english": "I'm sorry", "level": "A2", "frequency": 550},
]

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

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if email in users_db:
        return jsonify({"error": "User already exists"}), 400

    # Store user
    users_db[email] = {
        "email": email,
        "password": hash_password(password),
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

    # Get query parameters
    level = request.args.get('level', 'A1')
    limit = int(request.args.get('limit', 10))

    # Filter items by level
    filtered_items = [item for item in items_db if item.get('level') == level]

    # Sort by frequency and limit
    filtered_items.sort(key=lambda x: x.get('frequency', 0), reverse=True)
    result = filtered_items[:limit]

    logger.info(f"Returning {len(result)} exercises for level {level}")
    return jsonify(result)

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

    # Store review
    review = {
        "user_email": user_email,
        "item_id": item_id,
        "rating": rating,
        "timestamp": datetime.utcnow().isoformat()
    }
    reviews_db.append(review)

    logger.info(f"Stored review: user={user_email}, item={item_id}, rating={rating}")
    return jsonify({"message": "Review saved", "review_id": len(reviews_db)})

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