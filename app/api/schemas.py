from pydantic import BaseModel
from typing import Optional
from datetime import date
from typing import List, Optional
from datetime import datetime

# Project schemas
class ProjectBase(BaseModel):
    project_name: str
    system_name: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProjectUpdate(BaseModel):
    project_name: str
    system_name: Optional[str] = None

# Assessment Target schemas
class AssessmentTargetBase(BaseModel):
    target_name: str

class AssessmentTargetCreate(AssessmentTargetBase):
    project_id: int

class AssessmentTargetUpdate(AssessmentTargetBase):
    pass

class AssessmentTargetResponse(AssessmentTargetBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Assessment Scope schemas
class AssessmentScopeBase(BaseModel):
    doituong: str
    thongtin: str

class AssessmentScopeCreate(AssessmentScopeBase):
    project_id: int

class AssessmentScopeResponse(AssessmentScopeBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Collected Information schemas
class CollectedInformationBase(BaseModel):
    information: str

class CollectedInformationCreate(CollectedInformationBase):
    project_id: int

class CollectedInformationResponse(CollectedInformationBase):
    id: int
    project_id: int
    
    class Config:
        from_attributes = True

# Bug schemas
class BugBase(BaseModel):
    bug_type: str  # 'ungdung' or 'manguon'
    vulnerability_heading: str
    severity_text: Optional[str] = None  # 'Thấp', 'Trung Bình', 'Cao', 'Nghiêm Trọng'
    description: Optional[str] = None
    recommendation_content: Optional[str] = None

class BugCreate(BugBase):
    project_id: int
    target_id: int

class BugResponse(BugBase):
    id: int
    project_id: int
    target_id: int
    
    class Config:
        from_attributes = True

# Affected Object schemas
class AffectedObjectBase(BaseModel):
    object_url: str

class AffectedObjectCreate(AffectedObjectBase):
    bug_id: int

class AffectedObjectResponse(AffectedObjectBase):
    id: int
    bug_id: int
    
    class Config:
        from_attributes = True

# Recommendation schemas
class RecommendationBase(BaseModel):
    recommendation_text: str

class RecommendationCreate(RecommendationBase):
    bug_id: int

class RecommendationResponse(RecommendationBase):
    id: int
    bug_id: int
    
    class Config:
        from_attributes = True

class RecommendationListResponse(BaseModel):
    """Response schema cho recommendations với list chi tiết"""
    bug_id: int
    content: str  # Nội dung tổng hợp
    list: List[str]  # Danh sách các biện pháp chi tiết
    
    class Config:
        from_attributes = True

# Bug Image schemas
class BugImageBase(BaseModel):
    filename: str
    caption_text: Optional[str] = None

class BugImageCreate(BugImageBase):
    bug_id: int

class BugImageResponse(BugImageBase):
    id: int
    bug_id: int
    
    class Config:
        from_attributes = True

# CVE Information schemas
class CVEInformationBase(BaseModel):
    library: str
    cve: str
    latest_version: str

class CVEInformationCreate(CVEInformationBase):
    bug_id: int

class CVEInformationResponse(CVEInformationBase):
    id: int
    bug_id: int
    
    class Config:
        from_attributes = True

# Complex response schemas with relationships
class ProjectDetailResponse(ProjectResponse):
    assessment_targets: List[AssessmentTargetResponse] = []
    assessment_scopes: List[AssessmentScopeResponse] = []
    collected_information: List[CollectedInformationResponse] = []
    bugs: List[BugResponse] = []

class BugDetailResponse(BugResponse):
    affected_objects: List[AffectedObjectResponse] = []
    recommendations: List[RecommendationResponse] = []
    bug_images: List[BugImageResponse] = []
    cve_information: List[CVEInformationResponse] = []

# Schemas for get_all_data_project API
class VulnerabilityDetail(BaseModel):
    vulnerability: dict  # {"heading_text": str, "severity_text": str}
    description: dict  # {"text": str}
    affected_objects: dict  # {"list": List[str]}
    recommendations: dict  # {"content": str, "list": List[str]}
    images: List[dict]  # [{"filename": str, "description": str}]
    cve: List[dict]  # [{"library": str, "cve": str, "latest_version": str}]

class ReportSection(BaseModel):
    heading_text: str
    vulnerabilities: List[VulnerabilityDetail]

class ListReport(BaseModel):
    ungdung: List[ReportSection]
    manguon: List[ReportSection]
    last_updated_at: str
    assessment_targets: List[str]

class ProjectAllDataResponse(BaseModel):
    project_id: str
    project_name: str
    system_name: str
    targets: List[dict]  # [{"id": int, "name": str}]
    scope: List[dict]  # [{"id": int, "object": str, "info": str}]
    application_info: List[str]
    collected_information: List[CollectedInformationResponse] = []
    updated_at: str
    list_report: ListReport
    
    class Config:
        from_attributes = True