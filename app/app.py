import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.connection import engine, Base
from api.routes import router as api_router
from api.project_routes import router as project_router
from api.info_router import router as crud_router
from api.bug_router import router as bug_router
from api.bug_images_router import router as bug_images_router
from api.affected_objects_router import router as affected_objects_router
from api.cve_information_router import router as cve_information_router
from api.recommendations_router import router as recommendations_router
from api.project_data_router import router as project_data_router
from api.vulnerability_suggestion_router import router as vulnerability_suggestion_router
from auth.router import router as auth_router, admin_router
from db.init_db import init_database

init_database()

app = FastAPI(
    title="Security Assessment Backend", 
    version="2.0.0",
    description="Backend API for Security Assessment System"
)

allow_ips = [f"http://10.10.142.{i}:5173" for i in range(1, 255)]
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_ips,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(project_router, prefix="/api/v1", tags=["projects"])
app.include_router(crud_router, prefix="/api/v1", tags=["crud"])
app.include_router(bug_router, prefix="/api/v1", tags=["bugs"])
app.include_router(bug_images_router, prefix="/api/v1", tags=["bug-images"])
app.include_router(affected_objects_router, prefix="/api/v1", tags=["affected-objects"])
app.include_router(cve_information_router, prefix="/api/v1", tags=["cve-information"])
app.include_router(recommendations_router, prefix="/api/v1", tags=["recommendations"])
app.include_router(project_data_router, prefix="/api/v1", tags=["project-data"])
app.include_router(vulnerability_suggestion_router, prefix="/api/v1", tags=["vulnerability-suggestions"])
app.include_router(api_router, prefix="/api/v1", tags=["api"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Security Assessment Backend!",
        "version": "2.0.0",
        "docs": "/docs",
        "api_prefix": "/api/v1"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "security-assessment-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)