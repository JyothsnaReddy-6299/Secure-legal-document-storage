# SIH Problem Statement 26190: Secure Digital Document Management & Evidence Custody System

A secure, tamper-evident Document Management System (DMS) and Physical Evidence Custody Tracker designed for law enforcement and forensic science laboratories.

---

## 🚀 Key Features

* **Stage 1: Digital Document & Case Ingestion:**
  * Secure case registration.
  * Real-time SHA-256 cryptographic document hashing.
  * Automated text extraction from uploaded PDF and text documents using `pypdf`.
* **Stage 2: Physical Evidence & Blind FSL Custody Verification:**
  * Multi-attribute physical asset registration (IMEI/Serial, Tamper-evident Seal ID, Baseline Weight in grams).
  * **Blind Verification Protocol (ISO/IEC 27037):** Baseline weight is sealed in the database to prevent fraudulent handovers.
  * Automated weight tolerance checks ($\pm 0.5\text{g}$) and instant **Tamper Alarm** triggering.
  * Immutable custody history audit trail.
* **Persistent Database Storage:**
  * Automatic SQLite/MySQL support with zero mock data.

---

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, SQLAlchemy, PyPDF, ReportLab, Uvicorn
* **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios
* **Database:** MySQL / SQLite

---

## 💻 How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows PowerShell: .\venv\Scripts\activate
# Windows CMD: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
*Backend API is live at `http://localhost:8000`.*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend interface is live at `http://localhost:3000`.*
