from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .connection import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    project_name = Column(Text, nullable=False)
    system_name = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assessment_targets = relationship("AssessmentTarget", back_populates="project", cascade="all, delete-orphan")
    assessment_scopes = relationship("AssessmentScope", back_populates="project", cascade="all, delete-orphan")
    collected_information = relationship("CollectedInformation", back_populates="project", cascade="all, delete-orphan")
    bugs = relationship("Bug", back_populates="project", cascade="all, delete-orphan")

class AssessmentTarget(Base):
    __tablename__ = "assessment_targets"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    target_name = Column(Text, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="assessment_targets")
    bugs = relationship("Bug", back_populates="assessment_target", cascade="all, delete-orphan")

class AssessmentScope(Base):
    __tablename__ = "assessment_scope"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    doituong = Column(String, nullable=False)
    thongtin = Column(String, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="assessment_scopes")

class CollectedInformation(Base):
    __tablename__ = "collected_information"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    information = Column(Text, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="collected_information")

class Bug(Base):
    __tablename__ = "bugs"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    target_id = Column(Integer, ForeignKey("assessment_targets.id", ondelete="CASCADE"), nullable=False, index=True)
    bug_type = Column(String, nullable=False)
    vulnerability_heading = Column(Text, nullable=False)
    severity_text = Column(String)
    description = Column(Text)
    recommendation_content = Column(Text)
    
    # Check constraints
    __table_args__ = (
        CheckConstraint("bug_type IN ('ungdung', 'manguon')", name="check_bug_type"),
        CheckConstraint("severity_text IN ('Thấp', 'Trung Bình', 'Cao', 'Nghiêm Trọng')", name="check_severity_text"),
    )
    
    # Relationships
    project = relationship("Project", back_populates="bugs")
    assessment_target = relationship("AssessmentTarget", back_populates="bugs")
    affected_objects = relationship("AffectedObject", back_populates="bug", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="bug", cascade="all, delete-orphan")
    bug_images = relationship("BugImage", back_populates="bug", cascade="all, delete-orphan")
    cve_information = relationship("CVEInformation", back_populates="bug", cascade="all, delete-orphan")

class AffectedObject(Base):
    __tablename__ = "affected_objects"
    
    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False, index=True)
    object_url = Column(Text, nullable=False)
    
    # Relationships
    bug = relationship("Bug", back_populates="affected_objects")

class Recommendation(Base):
    __tablename__ = "recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False, index=True)
    recommendation_text = Column(Text, nullable=False)
    
    # Relationships
    bug = relationship("Bug", back_populates="recommendations")

class BugImage(Base):
    __tablename__ = "bug_images"
    
    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    caption_text = Column(Text)
    
    # Relationships
    bug = relationship("Bug", back_populates="bug_images")

class CVEInformation(Base):
    __tablename__ = "cve_information"
    
    id = Column(Integer, primary_key=True, index=True)
    bug_id = Column(Integer, ForeignKey("bugs.id", ondelete="CASCADE"), nullable=False, index=True)
    library = Column(String, nullable=False)
    cve = Column(String, nullable=False)
    latest_version = Column(String, nullable=False)
    
    # Relationships
    bug = relationship("Bug", back_populates="cve_information")

class VulnerabilityTemplate(Base):
    __tablename__ = "vulnerability_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    vulnerability_name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    recommendations = Column(Text, nullable=True)
    severity_text = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Check constraint for severity_text
    __table_args__ = (
        CheckConstraint("severity_text IN ('Thấp', 'Trung Bình', 'Cao', 'Nghiêm Trọng')", name="check_vulnerability_severity_text"),
    )