from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
import io
import json
import hashlib
import datetime
from pypdf import PdfReader

from database import engine, get_db, SessionLocal
import models

app = FastAPI(title="Stage 1 & 2: Police DMS & Forensic Evidence Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

@app.on_event("startup")
def startup():
    models.Base.metadata.create_all(bind=engine)
    os.makedirs(UPLOADS_DIR, exist_ok=True)

# ----------------- STAGE 1: CASES & DOCUMENTS -----------------

@app.get("/api/cases")
def get_cases(db: Session = Depends(get_db)):
    cases = db.query(models.Case).order_by(models.Case.id.desc()).all()
    results = []
    for c in cases:
        results.append({
            "id": c.id,
            "case_number": c.case_number,
            "title": c.title,
            "description": c.description,
            "status": c.status,
            "created_at": c.created_at.strftime("%Y-%m-%d %H:%M:%S") if c.created_at else "",
            "documents": [{
                "id": d.id,
                "title": d.title,
                "file_path": d.file_path,
                "file_hash": d.file_hash,
                "extracted_text": d.extracted_text,
                "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S") if d.created_at else ""
            } for d in c.documents],
            "assets": [{
                "id": a.id,
                "name": a.name,
                "serial_number": a.serial_number,
                "seal_id": a.seal_id,
                "weight_grams": a.weight_grams,
                "current_custodian": a.current_custodian,
                "status": a.status,
                "custody_history": json.loads(a.custody_history) if a.custody_history else [],
                "created_at": a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else ""
            } for a in c.assets]
        })
    return results

@app.post("/api/cases")
def create_case(
    case_number: str = Form(...),
    title: str = Form(...),
    description: str = Form(""),
    db: Session = Depends(get_db)
):
    case_no_clean = case_number.strip()
    existing = db.query(models.Case).filter(models.Case.case_number == case_no_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Case number '{case_no_clean}' is already registered in the database.")
    
    new_case = models.Case(
        case_number=case_no_clean,
        title=title.strip(),
        description=description.strip()
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    return new_case

# Delete a case and all its associated documents & evidence from the database
@app.delete("/api/cases/{case_id}")
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in database.")
    
    # Optionally delete physical files from uploads folder
    for doc in case.documents:
        if doc.file_path and os.path.exists(doc.file_path):
            try:
                os.remove(doc.file_path)
            except Exception:
                pass
                
    case_no = case.case_number
    db.delete(case)
    db.commit()
    return {"message": f"Case '{case_no}' and its associated records have been permanently deleted from the database."}

@app.post("/api/documents/upload")
async def upload_document(
    case_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found in database.")
    
    file_bytes = await file.read()
    file_hash = hashlib.sha256(file_bytes).hexdigest()
    
    # Text Extraction Pipeline (PDF & TXT)
    extracted_text = ""
    filename_lower = file.filename.lower()
    
    try:
        if filename_lower.endswith(".pdf"):
            pdf_file = io.BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            page_texts = []
            for page in reader.pages:
                txt = page.extract_text()
                if txt:
                    page_texts.append(txt.strip())
            extracted_text = "\n\n".join(page_texts)
        elif filename_lower.endswith((".txt", ".csv", ".json", ".log")):
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
        else:
            extracted_text = f"[Binary/Image File: {file.filename} - Uploaded and SHA-256 hashed successfully]"
    except Exception as e:
        extracted_text = f"[Text parsing error: {e}]"
        
    if not extracted_text.strip():
        extracted_text = f"File: {file.filename} (Uploaded successfully, no embedded text layer found)."

    # Save physical file to uploads/ directory
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    file_path = os.path.join(UPLOADS_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(file_bytes)
        
    # Save record to Database
    new_doc = models.Document(
        case_id=case_id,
        title=title.strip(),
        file_path=file_path,
        file_hash=file_hash,
        extracted_text=extracted_text[:9500]
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    return {
        "message": "Document uploaded and SHA-256 hash saved successfully!",
        "document_id": new_doc.id,
        "title": new_doc.title,
        "file_hash": new_doc.file_hash,
        "extracted_text": new_doc.extracted_text
    }

# ----------------- STAGE 2: PHYSICAL EVIDENCE & FSL CUSTODY -----------------

@app.post("/api/evidence")
def register_evidence(
    case_id: int = Form(...),
    name: str = Form(...),
    serial_number: str = Form("N/A"),
    seal_id: str = Form(...),
    weight_grams: float = Form(...),
    current_custodian: str = Form(...),
    db: Session = Depends(get_db)
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
        
    seal_clean = seal_id.strip()
    dup = db.query(models.EvidenceAsset).filter(models.EvidenceAsset.seal_id == seal_clean).first()
    if dup:
        raise HTTPException(status_code=400, detail=f"Seal ID '{seal_clean}' is already registered for another item.")
        
    timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    initial_history = [{
        "timestamp": timestamp_str,
        "action": f"Seized at Crime Scene by {current_custodian.strip()}",
        "custodian": current_custodian.strip(),
        "seal_id": seal_clean,
        "weight_g": weight_grams,
        "status": "Seized",
        "is_valid": True
    }]
    
    new_asset = models.EvidenceAsset(
        case_id=case_id,
        name=name.strip(),
        serial_number=serial_number.strip(),
        seal_id=seal_clean,
        weight_grams=weight_grams,
        current_custodian=current_custodian.strip(),
        status="Seized",
        custody_history=json.dumps(initial_history)
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@app.post("/api/evidence/{asset_id}/verify-custody")
def verify_custody(
    asset_id: int,
    scanned_seal_id: str = Form(...),
    measured_weight_grams: float = Form(...),
    new_custodian: str = Form(...),
    destination_status: str = Form("In_Forensics_Lab"),
    db: Session = Depends(get_db)
):
    asset = db.query(models.EvidenceAsset).filter(models.EvidenceAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Evidence item not found.")
        
    scanned_seal = scanned_seal_id.strip()
    seal_matches = (asset.seal_id == scanned_seal)
    
    weight_diff = abs(asset.weight_grams - measured_weight_grams)
    weight_matches = (weight_diff <= 0.5)
    
    is_tampered = not (seal_matches and weight_matches)
    timestamp_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    history = json.loads(asset.custody_history) if asset.custody_history else []
    
    if is_tampered:
        asset.status = "FLAGGED_TAMPERED"
        reasons = []
        if not seal_matches:
            reasons.append(f"Seal ID mismatch (Expected: {asset.seal_id}, Scanned: {scanned_seal})")
        if not weight_matches:
            reasons.append(f"Weight discrepancy (Expected: {asset.weight_grams}g, Measured: {measured_weight_grams}g, Diff: {round(weight_diff, 2)}g)")
            
        action_note = f"TAMPER ALERT TRIGGERED: " + "; ".join(reasons)
    else:
        asset.status = destination_status
        asset.current_custodian = new_custodian.strip()
        action_note = f"Custody verified & handed over to {new_custodian.strip()} ({destination_status.replace('_', ' ')})"
        
    history.append({
        "timestamp": timestamp_str,
        "action": action_note,
        "custodian": new_custodian.strip(),
        "seal_id": scanned_seal,
        "weight_g": measured_weight_grams,
        "status": asset.status,
        "is_valid": not is_tampered
    })
    
    asset.custody_history = json.dumps(history)
    asset.last_updated = datetime.datetime.utcnow()
    db.commit()
    db.refresh(asset)
    
    return {
        "success": not is_tampered,
        "status": asset.status,
        "details": {
            "seal_verified": seal_matches,
            "weight_verified": weight_matches,
            "expected_weight_g": asset.weight_grams,
            "measured_weight_g": measured_weight_grams,
            "weight_diff_g": round(weight_diff, 2)
        }
    }
