import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from .connection import Base, engine, get_db
from .models import (
    Project, AssessmentTarget, AssessmentScope, CollectedInformation,
    Bug, AffectedObject, Recommendation, BugImage, CVEInformation
)
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Tạo tất cả các bảng trong database"""
    try:
        logger.info("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All tables created successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Error creating tables: {e}")
        return False

def drop_tables():
    """Xóa tất cả các bảng trong database"""
    try:
        logger.info("Dropping all tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✅ All tables dropped successfully!")
        return True
    except Exception as e:
        logger.error(f"❌ Error dropping tables: {e}")
        return False

def reset_database():
    """Reset database - xóa và tạo lại tất cả bảng"""
    logger.info("🔄 Resetting database...")
    if drop_tables() and create_tables():
        logger.info("✅ Database reset successfully!")
        return True
    else:
        logger.error("❌ Failed to reset database")
        return False

def test_connection():
    """Kiểm tra kết nối database"""
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            logger.info("✅ Database connection successful!")
            return True
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False

def verify_tables():
    """Kiểm tra sự tồn tại của các bảng"""
    try:
        with engine.connect() as connection:
            # Lấy danh sách tất cả bảng
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            
            existing_tables = [row[0] for row in result]
            expected_tables = [
                'projects', 'assessment_targets', 'assessment_scope', 
                'collected_information', 'bugs', 'affected_objects',
                'recommendations', 'bug_images', 'cve_information'
            ]
            
            logger.info(f"📋 Existing tables: {existing_tables}")
            
            missing_tables = [table for table in expected_tables if table not in existing_tables]
            if missing_tables:
                logger.warning(f"⚠️ Missing tables: {missing_tables}")
                return False
            else:
                logger.info("✅ All expected tables exist!")
                return True
                
    except Exception as e:
        logger.error(f"❌ Error verifying tables: {e}")
        return False

def init_database():
    """Khởi tạo database hoàn chỉnh"""
    logger.info("🚀 Initializing database...")
    
    # Kiểm tra kết nối
    if not test_connection():
        return False
    
    # Tạo bảng
    if not create_tables():
        return False
    
    # Xác minh bảng
    if not verify_tables():
        return False
    
    logger.info("🎉 Database initialization completed successfully!")
    return True

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "init":
            init_database()
        elif command == "reset":
            confirm = input("⚠️ This will delete all data. Are you sure? (yes/no): ")
            if confirm.lower() == "yes":
                reset_database()
            else:
                print("❌ Operation cancelled")
        elif command == "test":
            test_connection()
        elif command == "verify":
            verify_tables()
        else:
            print("Usage: python init_db.py [init|reset|test|verify]")
    else:
        print("Usage: python init_db.py [init|reset|test|verify]")