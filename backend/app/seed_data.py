"""
Seed data for MentorMatch categories and sample mentors
Run with: python -m app.seed_data
"""

import os
import sys
from datetime import datetime, time
from decimal import Decimal

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base, hash_password
from app.models.mentoring import (
    Profile, Category, MentorCategory, ExpertiseTag, MentorTag,
    AvailabilitySlot, ExpertiseLevel
)


def create_categories(db: Session) -> dict:
    """Create main categories and subcategories"""

    categories_data = [
        # Main Categories
        {
            "name": "Engineering",
            "slug": "engineering",
            "description": "Software, mechanical, electrical, and civil engineering mentorship",
            "icon": "code",
            "display_order": 1,
            "subcategories": [
                {"name": "Software Engineering", "slug": "software-engineering", "description": "Web, mobile, backend, frontend development"},
                {"name": "Data Science", "slug": "data-science", "description": "ML, AI, data analytics, and statistics"},
                {"name": "DevOps & Cloud", "slug": "devops-cloud", "description": "AWS, Azure, GCP, CI/CD, infrastructure"},
                {"name": "Mechanical Engineering", "slug": "mechanical-engineering", "description": "Design, manufacturing, automotive"},
                {"name": "Electrical Engineering", "slug": "electrical-engineering", "description": "Electronics, power systems, embedded"},
            ]
        },
        {
            "name": "Medicine",
            "slug": "medicine",
            "description": "Medical career guidance and exam preparation",
            "icon": "heart-pulse",
            "display_order": 2,
            "subcategories": [
                {"name": "Medical Studies", "slug": "medical-studies", "description": "USMLE, medical school applications"},
                {"name": "Residency", "slug": "residency", "description": "Residency matching, specialty selection"},
                {"name": "German Medical License", "slug": "german-medical-license", "description": "Approbation, Kenntnisprufung, FSP"},
                {"name": "Clinical Practice", "slug": "clinical-practice", "description": "Patient care, clinical skills"},
            ]
        },
        {
            "name": "Nursing",
            "slug": "nursing",
            "description": "Nursing career development and certification",
            "icon": "stethoscope",
            "display_order": 3,
            "subcategories": [
                {"name": "Nursing Education", "slug": "nursing-education", "description": "Nursing school, NCLEX preparation"},
                {"name": "German Nursing Recognition", "slug": "german-nursing-recognition", "description": "Anerkennung, qualification recognition"},
                {"name": "Specializations", "slug": "nursing-specializations", "description": "ICU, OR, pediatrics, geriatrics"},
            ]
        },
        {
            "name": "Life in Germany",
            "slug": "life-in-germany",
            "description": "Navigate German bureaucracy, visas, and daily life",
            "icon": "home",
            "display_order": 4,
            "subcategories": [
                {"name": "Visa & Immigration", "slug": "visa-immigration", "description": "Blue Card, family reunion, residence permits"},
                {"name": "Settling In", "slug": "settling-in", "description": "Anmeldung, bank account, health insurance"},
                {"name": "Job Search", "slug": "job-search", "description": "German job market, applications, interviews"},
                {"name": "Family Matters", "slug": "family-matters", "description": "Bringing spouse, parents, children to Germany"},
                {"name": "Language & Integration", "slug": "language-integration", "description": "German courses, integration, culture"},
            ]
        },
        {
            "name": "Premium",
            "slug": "premium",
            "description": "Learn from industry leaders and celebrities",
            "icon": "crown",
            "display_order": 5,
            "subcategories": [
                {"name": "Celebrity Photographers", "slug": "celebrity-photographers", "description": "Learn from award-winning photographers"},
                {"name": "Master Chefs", "slug": "master-chefs", "description": "Culinary arts from renowned chefs"},
                {"name": "Journalists & Writers", "slug": "journalists-writers", "description": "Storytelling and journalism"},
                {"name": "Entrepreneurs", "slug": "entrepreneurs", "description": "Startup founders and business leaders"},
            ]
        },
    ]

    created_categories = {}

    for cat_data in categories_data:
        subcategories = cat_data.pop("subcategories", [])

        # Check if category exists
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if existing:
            parent_cat = existing
            print(f"Category '{cat_data['name']}' already exists, skipping...")
        else:
            parent_cat = Category(**cat_data)
            db.add(parent_cat)
            db.flush()
            print(f"Created category: {cat_data['name']}")

        created_categories[cat_data["slug"]] = parent_cat

        # Create subcategories
        for sub_data in subcategories:
            existing_sub = db.query(Category).filter(Category.slug == sub_data["slug"]).first()
            if existing_sub:
                created_categories[sub_data["slug"]] = existing_sub
                print(f"  Subcategory '{sub_data['name']}' already exists, skipping...")
            else:
                sub_cat = Category(
                    **sub_data,
                    parent_id=parent_cat.id,
                    icon=parent_cat.icon,
                    display_order=subcategories.index(sub_data) + 1
                )
                db.add(sub_cat)
                db.flush()
                created_categories[sub_data["slug"]] = sub_cat
                print(f"  Created subcategory: {sub_data['name']}")

    db.commit()
    return created_categories


def create_expertise_tags(db: Session, categories: dict) -> dict:
    """Create expertise tags for categories"""

    tags_data = {
        "software-engineering": [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "Go", "Rust",
            "System Design", "Microservices", "APIs", "Databases", "Testing"
        ],
        "data-science": [
            "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
            "Python", "TensorFlow", "PyTorch", "SQL", "Statistics"
        ],
        "visa-immigration": [
            "Blue Card", "Family Reunion", "Spouse Visa", "Parent Visa",
            "Work Permit", "Permanent Residency", "Citizenship"
        ],
        "settling-in": [
            "Anmeldung", "Bank Account", "Health Insurance", "Tax ID",
            "Apartment Hunting", "Schufa", "GEZ"
        ],
        "german-medical-license": [
            "Approbation", "Kenntnisprufung", "FSP", "Berufserlaubnis",
            "Document Preparation", "Language Requirements"
        ],
    }

    created_tags = {}

    for cat_slug, tags in tags_data.items():
        if cat_slug not in categories:
            continue

        category = categories[cat_slug]

        for tag_name in tags:
            tag_slug = tag_name.lower().replace(" ", "-").replace("/", "-")
            existing = db.query(ExpertiseTag).filter(ExpertiseTag.slug == tag_slug).first()
            if existing:
                created_tags[tag_slug] = existing
            else:
                tag = ExpertiseTag(
                    name=tag_name,
                    slug=tag_slug,
                    category_id=category.id
                )
                db.add(tag)
                db.flush()
                created_tags[tag_slug] = tag

    db.commit()
    print(f"Created {len(created_tags)} expertise tags")
    return created_tags


def create_sample_mentors(db: Session, categories: dict, tags: dict):
    """Create sample mentor profiles"""
    from app.database import User

    mentors_data = [
        {
            "email": "sarah.weber@example.com",
            "password": "demo123",
            "display_name": "Dr. Sarah Weber",
            "bio": "Former immigration lawyer with 10+ years helping expats navigate German bureaucracy. I've personally helped over 500 families reunite in Germany. Let me guide you through the visa maze!",
            "hourly_rate": Decimal("45.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German", "Hindi"],
            "categories": ["visa-immigration", "family-matters"],
            "expertise_level": ExpertiseLevel.expert,
            "years_experience": 10
        },
        {
            "email": "michael.schmidt@example.com",
            "password": "demo123",
            "display_name": "Michael Schmidt",
            "bio": "Senior Software Engineer at a major German tech company. I help international developers land their dream jobs in Germany's tech scene. From CV optimization to salary negotiation!",
            "hourly_rate": Decimal("55.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German"],
            "categories": ["software-engineering", "job-search"],
            "expertise_level": ExpertiseLevel.expert,
            "years_experience": 8
        },
        {
            "email": "anna.mueller@example.com",
            "password": "demo123",
            "display_name": "Anna Muller",
            "bio": "Registered nurse who successfully navigated the German nursing recognition process. Now I help international nurses get their qualifications recognized and find their first job in Germany.",
            "hourly_rate": Decimal("35.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German", "Polish"],
            "categories": ["german-nursing-recognition", "nursing-education"],
            "expertise_level": ExpertiseLevel.intermediate,
            "years_experience": 5
        },
        {
            "email": "dr.patel@example.com",
            "password": "demo123",
            "display_name": "Dr. Raj Patel",
            "bio": "Indian-trained doctor who passed Kenntnisprufung on first attempt. Currently working as a resident in Berlin. I'll share my complete roadmap to getting your Approbation.",
            "hourly_rate": Decimal("60.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German", "Hindi", "Gujarati"],
            "categories": ["german-medical-license", "medical-studies"],
            "expertise_level": ExpertiseLevel.expert,
            "years_experience": 6
        },
        {
            "email": "lisa.chen@example.com",
            "password": "demo123",
            "display_name": "Lisa Chen",
            "bio": "Data Scientist at a Berlin startup. Transitioned from academia to industry 3 years ago. I mentor aspiring data scientists on building portfolios, acing interviews, and negotiating offers.",
            "hourly_rate": Decimal("50.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German", "Mandarin"],
            "categories": ["data-science", "job-search"],
            "expertise_level": ExpertiseLevel.intermediate,
            "years_experience": 4
        },
        {
            "email": "chef.marco@example.com",
            "password": "demo123",
            "display_name": "Chef Marco Rossi",
            "bio": "Michelin-starred chef with 20 years of culinary experience. From Italian classics to modern fusion, I'll teach you the secrets of professional cooking in private sessions.",
            "hourly_rate": Decimal("150.00"),
            "timezone": "Europe/Berlin",
            "languages": ["English", "German", "Italian"],
            "categories": ["master-chefs"],
            "expertise_level": ExpertiseLevel.expert,
            "years_experience": 20,
            "is_premium": True
        },
    ]

    for mentor_data in mentors_data:
        # Check if user exists
        existing_user = db.query(User).filter(User.email == mentor_data["email"]).first()
        if existing_user:
            print(f"User {mentor_data['email']} already exists, skipping...")
            continue

        # Create user
        user = User(
            email=mentor_data["email"],
            password_hash=hash_password(mentor_data["password"])
        )
        db.add(user)
        db.flush()

        # Create profile
        profile = Profile(
            user_id=user.id,
            display_name=mentor_data["display_name"],
            bio=mentor_data["bio"],
            hourly_rate=mentor_data["hourly_rate"],
            is_mentor=True,
            is_verified=True,
            timezone=mentor_data["timezone"],
            languages=mentor_data["languages"]
        )
        db.add(profile)
        db.flush()

        # Link categories
        for cat_slug in mentor_data["categories"]:
            if cat_slug in categories:
                mentor_cat = MentorCategory(
                    mentor_id=profile.id,
                    category_id=categories[cat_slug].id,
                    expertise_level=mentor_data["expertise_level"],
                    years_experience=mentor_data["years_experience"]
                )
                db.add(mentor_cat)

        # Create availability (Mon-Fri 9am-5pm)
        for day in range(5):  # Monday to Friday
            slot = AvailabilitySlot(
                mentor_id=profile.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
                is_active=True
            )
            db.add(slot)

        print(f"Created mentor: {mentor_data['display_name']}")

    db.commit()


def seed_database():
    """Main seed function"""
    print("=" * 50)
    print("MentorMatch Database Seeder")
    print("=" * 50)

    # Initialize database
    from app.models.mentoring import Base as MentoringBase
    MentoringBase.metadata.create_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("\n1. Creating categories...")
        categories = create_categories(db)

        print("\n2. Creating expertise tags...")
        tags = create_expertise_tags(db, categories)

        print("\n3. Creating sample mentors...")
        create_sample_mentors(db, categories, tags)

        print("\n" + "=" * 50)
        print("Seeding complete!")
        print("=" * 50)

        # Print summary
        cat_count = db.query(Category).count()
        profile_count = db.query(Profile).filter(Profile.is_mentor == True).count()
        tag_count = db.query(ExpertiseTag).count()

        print(f"\nSummary:")
        print(f"  - Categories: {cat_count}")
        print(f"  - Expertise Tags: {tag_count}")
        print(f"  - Mentors: {profile_count}")

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
