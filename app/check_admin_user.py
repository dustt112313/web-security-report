#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from db.connection import SessionLocal
from db.models import User
from passlib.context import CryptContext

def check_admin_user():
    """Kiểm tra xem có user admin nào trong database không"""
    try:
        with SessionLocal() as db:
            # Kiểm tra tất cả users trong database
            users = db.query(User).all()
            print(f"Tổng số users trong database: {len(users)}")
            
            if not users:
                print("Không có user nào trong database!")
                return
            
            print("\nDanh sách users:")
            for user in users:
                print(f"- ID: {user.id}, Username: {user.username}, Email: {user.email}, Active: {user.is_active}, Admin: {user.is_admin}")
            
            # Tìm user admin
            admin_user = db.query(User).filter(User.username == "admin").first()
            if admin_user:
                print(f"\nTìm thấy user admin:")
                print(f"- ID: {admin_user.id}")
                print(f"- Username: {admin_user.username}")
                print(f"- Email: {admin_user.email}")
                print(f"- Active: {admin_user.is_active}")
                print(f"- Admin: {admin_user.is_admin}")
                print(f"- Hashed Password: {admin_user.hashed_password[:50]}...")
                
                # Kiểm tra password
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                is_valid = pwd_context.verify("admin123", admin_user.hashed_password)
                print(f"- Password 'admin123' hợp lệ: {is_valid}")
            else:
                print("\nKhông tìm thấy user admin!")
                
                # Tạo user admin mới
                print("Tạo user admin mới...")
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                hashed_password = pwd_context.hash("admin123")
                
                new_admin = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=hashed_password,
                    role="admin",
                    is_active=True
                )
                
                db.add(new_admin)
                db.commit()
                print("✅ Tạo user admin thành công!")
                
    except Exception as e:
        print(f"❌ Lỗi khi kiểm tra admin user: {e}")

if __name__ == "__main__":
    check_admin_user()