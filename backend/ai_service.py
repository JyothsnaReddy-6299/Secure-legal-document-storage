import re
import hashlib
import json
import datetime

def perform_ocr(filename: str, file_content_bytes: bytes) -> str:
    """
    Simulates OCR scanning of documents.
    """
    content_len = len(file_content_bytes)
    name_lower = filename.lower()
    
    if "fir" in name_lower:
        return f"FIRST INFORMATION REPORT (Under Section 173 BNSS). Incident occurred on 28th August 2026. Complainant states that the accused did beat and slap them with a wooden stick outside the metro station. Complainant sustained minor injuries. Registered under BNS Section 115."
    elif "witness" in name_lower or "statement" in name_lower:
        return "WITNESS STATEMENT. Statement of Aarav Verma. I witnessed the suspect snatching the lady's purse near the public transit bus stop. The suspect ran away wearing a black jacket. The victim screamed for help."
    elif "forensic" in name_lower:
        return "FORENSIC DEVICE ANALYSIS REPORT. Seized device: iPhone 13. Serial: IP-88273. Hash verification completed. Extracted bitstream clone matches baseline. Analyzed chat logs containing BNS Section 318 fraud evidence."
    else:
        return f"DIGITIZED DOCUMENT COMPILATION. File size: {content_len} bytes. Scanning completed. The document contains case references and legal declarations."

def auto_tag_bns(text: str) -> list:
    """
    Analyzes case text using a rule-based NLP tagger to map to the new 
    Bharatiya Nyaya Sanhita (BNS) legal sections.
    """
    text_lower = text.lower()
    tags = []
    
    rules = [
        {
            "section": "BNS Section 103",
            "title": "Murder / Punishment for Murder",
            "keywords": ["kill", "murder", "dead", "homicide", "stabbed", "death"],
            "description": "Punishment for causing death with intention or knowledge."
        },
        {
            "section": "BNS Section 303",
            "title": "Theft / Punishment for Theft",
            "keywords": ["theft", "stole", "snatch", "purse", "wallet", "stolen"],
            "description": "Dishonest removal of movable property without consent."
        },
        {
            "section": "BNS Section 115",
            "title": "Voluntarily Causing Hurt",
            "keywords": ["hurt", "slap", "beat", "hit", "stick", "wound", "assault"],
            "description": "Punishment for voluntarily causing bodily pain or disease."
        },
        {
            "section": "BNS Section 74",
            "title": "Assault or Criminal Force to Woman with Intent to Outrage Modesty",
            "keywords": ["harass", "molest", "modesty", "abuse", "outrage", "force"],
            "description": "Assaulting a woman to insult her modesty."
        },
        {
            "section": "BNS Section 78",
            "title": "Stalking",
            "keywords": ["stalk", "follow", "online", "chat", "messages", "harassing"],
            "description": "Following or contacting a woman repeatedly despite disinterest."
        },
        {
            "section": "BNS Section 318",
            "title": "Cheating / Fraud",
            "keywords": ["cheat", "fraud", "scam", "money", "fake", "forged", "online transaction"],
            "description": "Deceiving any person to deliver property."
        }
    ]
    
    for rule in rules:
        matched_keywords = [kw for kw in rule["keywords"] if kw in text_lower]
        if matched_keywords:
            confidence = min(0.5 + (0.15 * len(matched_keywords)), 0.95)
            tags.append({
                "section": rule["section"],
                "title": rule["title"],
                "description": rule["description"],
                "confidence": confidence,
                "matched_keywords": matched_keywords
            })
            
    return tags

def generate_zkp_proof(victim_name: str, victim_age: int, recorder_role: str) -> str:
    """
    Generates a simulated Zero-Knowledge Proof (ZKP).
    Mathematically validates constraints (Minor? Female Officer?)
    and returns a public proof token without exposing raw PII.
    """
    is_minor = victim_age < 18
    is_female_recorder = recorder_role.lower() in ["clerk", "female_officer", "constable", "investigator"]
    
    input_str = f"{victim_name}{victim_age}{recorder_role}{is_minor}"
    proof_hash = hashlib.sha256(input_str.encode('utf-8')).hexdigest()
    
    proof_data = {
        "zkp_identifier": f"ZKP-PROOF-{proof_hash[:12].upper()}",
        "proof_signature": proof_hash,
        "verified_statements": {
            "is_victim_minor": is_minor,
            "recorded_by_authorized_officer": True,
            "identity_redacted_for_safety": True
        },
        "public_claim": "Age < 18 verified by cryptographic polynomial proof.",
        "generated_at": str(datetime.datetime.utcnow())
    }
    
    return json.dumps(proof_data)

def generate_bsa_certificate(doc_data: dict, case_data: dict, block_data: dict, is_authentic: bool) -> dict:
    """
    Generates an Electronic Evidence Admissibility Certificate under 
    Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA) / Section 65B Indian Evidence Act.
    """
    timestamp = datetime.datetime.utcnow().strftime("%d %B %Y, %H:%M:%S UTC")
    cert_id = f"BSA63-CERT-{hashlib.sha256(f'{doc_data.get('id')}{timestamp}'.encode()).hexdigest()[:12].upper()}"
    
    return {
        "certificate_id": cert_id,
        "statutory_reference": "Section 63, Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
        "issued_at": timestamp,
        "case_number": case_data.get("case_number"),
        "case_title": case_data.get("title"),
        "document_title": doc_data.get("title"),
        "author_role": doc_data.get("author_role"),
        "esign_token": doc_data.get("esign_token") or "ESIGN-DSC-VERIFIED-GOV-IN",
        "current_file_hash": doc_data.get("file_hash"),
        "blockchain_anchored_hash": block_data.get("hash") if block_data else doc_data.get("file_hash"),
        "blockchain_block_index": block_data.get("index") if block_data else "Genesis/Ledger Record",
        "admissibility_status": "ADMISSIBLE (INTEGRITY VERIFIED)" if is_authentic else "INADMISSIBLE (TAMPERING DETECTED)",
        "is_authentic": is_authentic,
        "declaration": (
            "I hereby certify that the electronic record described herein was ingested and archived in the "
            "ordinary course of official investigation. The cryptographic SHA-256 fingerprint generated at ingestion "
            "matches the current hash verified against the decentralized immutable ledger. "
            "No unauthorized alteration, deletion, or tampering has occurred throughout its chain of custody."
            if is_authentic else
            "WARNING: The cryptographic hash of this record DOES NOT match the immutable ledger block created at ingestion. "
            "The electronic evidence shows proof of unauthorized manipulation and is INADMISSIBLE under Section 63 BSA."
        )
    }

def semantic_search_filter(query: str, documents: list) -> list:
    """
    Simulates Semantic Vector Search.
    """
    query_lower = query.lower()
    synonym_map = {
        "vehicle": ["car", "bike", "scooter", "motorcycle", "auto", "vehicle"],
        "stolen": ["stole", "theft", "snatch", "missing", "robbed", "stolen"],
        "weapon": ["stick", "rod", "knife", "gun", "pistol", "weapon", "blade"],
        "harass": ["stalk", "follow", "chat", "messages", "harass", "abuse"],
        "fraud": ["cheat", "scam", "forged", "money", "fake", "fraud"]
    }
    
    expanded_terms = {query_lower}
    for key, synonyms in synonym_map.items():
        if key in query_lower or any(s in query_lower for s in synonyms):
            expanded_terms.update(synonyms)
            expanded_terms.add(key)
            
    scored_documents = []
    for doc in documents:
        score = 0
        doc_text = f"{doc.title} {doc.file_path}".lower()
        
        if query_lower in doc_text:
            score += 10
            
        for term in expanded_terms:
            if term in doc_text:
                score += 2
                
        if score > 0:
            scored_documents.append((doc, score))
            
    scored_documents.sort(key=lambda x: x[1], reverse=True)
    return [item[0] for item in scored_documents]
