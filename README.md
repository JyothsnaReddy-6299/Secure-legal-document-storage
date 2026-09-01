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

## 👥 How a Friend/Teammate Can Clone and Run

If a friend wants to clone this project and work on it, they can follow these steps:

### Step 1: Clone the Repository
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <REPOSITORY_FOLDER_NAME>
```

---

### Step 2: Set Up and Run the Backend (Terminal 1)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   * **Windows PowerShell:** `.\venv\Scripts\activate`
   * **Windows Command Prompt (cmd):** `venv\Scripts\activate`
   * **Linux / macOS:** `source venv/bin/activate`
4. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```
   *(Backend API will run at `http://localhost:8000`)*

---

### Step 3: Set Up and Run the Frontend (Terminal 2)

1. Open a **second terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install all frontend dependencies:
   ```bash
   npm install
   ```
3. Start the React development server:
   ```bash
   npm run dev
   ```
   *(Frontend interface will run at `http://localhost:3000`)*

---

### Step 4: Open in Browser
Open your browser and navigate to:
👉 **`http://localhost:3000`**
