import hashlib
import json
import datetime
from sqlalchemy.orm import Session
from models import LedgerBlock

def calculate_hash(block_index: int, timestamp: str, event_type: str, event_details: str, previous_hash: str) -> str:
    """Calculates SHA-256 hash of block contents."""
    block_string = f"{block_index}{timestamp}{event_type}{event_details}{previous_hash}".encode('utf-8')
    return hashlib.sha256(block_string).hexdigest()

def create_genesis_block(db: Session) -> LedgerBlock:
    """Creates the genesis block on the ledger if it doesn't exist."""
    existing = db.query(LedgerBlock).filter(LedgerBlock.block_index == 0).first()
    if existing:
        return existing
    
    timestamp = datetime.datetime.utcnow()
    event_details = json.dumps({"message": "Genesis Block - SIH DMS Security Ledger Active"})
    genesis_hash = calculate_hash(0, str(timestamp), "Genesis", event_details, "0" * 64)
    
    db_block = LedgerBlock(
        block_index=0,
        timestamp=timestamp,
        event_type="Genesis",
        event_details=event_details,
        previous_hash="0" * 64,
        block_hash=genesis_hash
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

def add_block(db: Session, event_type: str, event_details_dict: dict) -> LedgerBlock:
    """Adds a new block logging a document or physical asset transaction to the chain."""
    create_genesis_block(db)
    
    last_block = db.query(LedgerBlock).order_by(LedgerBlock.block_index.desc()).first()
    new_index = last_block.block_index + 1
    previous_hash = last_block.block_hash
    
    timestamp = datetime.datetime.utcnow()
    event_details = json.dumps(event_details_dict)
    block_hash = calculate_hash(new_index, str(timestamp), event_type, event_details, previous_hash)
    
    db_block = LedgerBlock(
        block_index=new_index,
        timestamp=timestamp,
        event_type=event_type,
        event_details=event_details,
        previous_hash=previous_hash,
        block_hash=block_hash
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

def verify_chain(db: Session) -> bool:
    """
    Loops through the database ledger blocks sequentially, computing their hashes.
    Returns True if the entire chain is valid and untampered, False otherwise.
    """
    blocks = db.query(LedgerBlock).order_by(LedgerBlock.block_index.asc()).all()
    if not blocks:
        return True
    
    for i in range(len(blocks)):
        current = blocks[i]
        
        calculated_current_hash = calculate_hash(
            current.block_index,
            str(current.timestamp),
            current.event_type,
            current.event_details,
            current.previous_hash
        )
        if current.block_hash != calculated_current_hash:
            print(f"Validation failed: Block {current.block_index} hash mismatch.")
            return False
            
        if i > 0:
            previous = blocks[i-1]
            if current.previous_hash != previous.block_hash:
                print(f"Validation failed: Linkage broken between Block {previous.block_index} and {current.block_index}.")
                return False
                
    return True
