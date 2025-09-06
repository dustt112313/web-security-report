import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from argon2 import PasswordHasher
from db.connection import SessionLocal
from auth.models import User

def fix_admin_password():
    """Fix admin password hash in database"""
    try:
        # Hash the correct password
        ph = PasswordHasher()
        correct_password = "admin123"
        password_hash = ph.hash(correct_password)
        
        print(f"Generated password hash: {password_hash}")
        
        # Update database using SQLAlchemy
        db = SessionLocal()
        
        admin_user = db.query(User).filter(User.username == "admin").first()
        if admin_user:
            admin_user.password_hash = password_hash
            db.commit()
            print("✅ Admin password hash updated successfully!")
        else:
            print("❌ Admin user not found!")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error fixing admin password: {e}")

if __name__ == "__main__":
    fix_admin_password()