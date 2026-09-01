from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Case(Base):
    __tablename__ = "cases"
    
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), default="")
    status = Column(String(50), default="Under Investigation")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    documents = relationship("Document", back_populates="case", cascade="all, delete-orphan")
    assets = relationship("EvidenceAsset", back_populates="case", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False) # SHA-256 digital fingerprint
    extracted_text = Column(String(10000), default="") # Extracted text from PDF / TXT
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="documents")

class EvidenceAsset(Base):
    __tablename__ = "evidence_assets"
    
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False) # e.g. "Seized Smartphone"
    serial_number = Column(String(100), default="N/A") # e.g. IMEI or Serial Number
    seal_id = Column(String(100), unique=True, nullable=False) # Tamper-evident seal ID
    weight_grams = Column(Float, nullable=False) # Exact baseline weight in grams
    current_custodian = Column(String(100), nullable=False) # Officer name
    status = Column(String(50), default="Seized") # Seized, In_Vault, In_Forensics_Lab, FLAGGED_TAMPERED
    custody_history = Column(String(3000), default="[]") # JSON list of all handovers
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    case = relationship("Case", back_populates="assets")
