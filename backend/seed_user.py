from app.database import SessionLocal
from app.models import User
from app.auth import hash_password

db = SessionLocal()

existing_user = db.query(User).filter(User.username == "admin").first()

if not existing_user:
    user = User(
        username="admin",
        password_hash=hash_password("admin123")
    )
    db.add(user)
    db.commit()
    print("User created successfully: admin / admin123")
else:
    print("User already exists")

db.close()
