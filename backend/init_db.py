import database
import models
import crud
import schemas

def init_db():
    print("Initializing database...")
    # 1. Drop and recreate tables
    database.Base.metadata.drop_all(bind=database.engine)
    database.Base.metadata.create_all(bind=database.engine)
    
    # 2. Seed demo user
    db = database.SessionLocal()
    try:
        demo_email = "demo@skydo.com"
        print(f"Seeding demo user: {demo_email}")
        demo_user_schema = schemas.UserCreate(email=demo_email, password="password123")
        new_user = crud.create_user(db, demo_user_schema)
        
        # Auto-provision USD account for demo user
        crud.provision_default_virtual_account(db, new_user.id)
        
        print("Database initialization complete.")
    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
