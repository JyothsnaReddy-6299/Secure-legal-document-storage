import os
from database import engine, Base
import models

def reset_database():
    print("Resetting database...")
    # Drop all existing tables and recreate them completely empty
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("Database is now 100% empty and ready for your data!")

if __name__ == "__main__":
    reset_database()
