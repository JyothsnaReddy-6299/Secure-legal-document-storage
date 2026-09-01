import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Shield, Database, RefreshCw, FolderOpen, Plus, Upload, CheckCircle2,
  FileText, Smartphone, Lock, Trash2, ChevronDown, ChevronUp, FileCode,
  UserCheck, History, Building2, Scale as ScaleIcon, Eye, ArrowRight, LogOut,
  Key, User, ShieldAlert, Award, Search, LogIn, Home, Layers
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

function App() {
  // Navigation View Modes: "home", "login", "dashboard"
  const [viewMode, setViewMode] = useState("home");
  
  // Selected Target Role for Login
  const [targetRole, setTargetRole] = useState("constable");

  // Authentication State
  const [currentUser, setCurrentUser] = useState(null);
  const [loginBadge, setLoginBadge] = useState("CONSTABLE101");
  const [loginPassword, setLoginPassword] = useState("police123");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Workspace View State: "case_details" or "create_case"
  const [rightWorkspaceMode, setRightWorkspaceMode] = useState("case_details");

  // Workspace Tabs: "documents", "evidence", "audit"
  const [activeTab, setActiveTab] = useState("documents");

  // Database Cases State
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [expandedDocId, setExpandedDocId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Case Form State
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseDesc, setNewCaseDesc] = useState("");

  // Upload Document Form State
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Evidence Form State
  const [assetName, setAssetName] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetSeal, setAssetSeal] = useState("");
  const [assetWeight, setAssetWeight] = useState("");
  const [assetCustodian, setAssetCustodian] = useState("");

  // FSL Handshake Form State
  const [verifyAssetId, setVerifyAssetId] = useState("");
  const [verifySeal, setVerifySeal] = useState("");
  const [verifyWeight, setVerifyWeight] = useState("");
  const [verifyCustodian, setVerifyCustodian] = useState("");
  const [verifyDestination, setVerifyDestination] = useState("In_Forensics_Lab");

  // Notifications
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetchCases();
  }, []);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(""), 5000);
    } else {
      setMessage(msg);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const fetchCases = async () => {
    try {
      const res = await axios.get(`${API_BASE}/cases`);
      setCases(res.data);
      if (res.data.length > 0) {
        if (!selectedCaseId) {
          setSelectedCaseId(res.data[0].id);
        } else {
          const exists = res.data.some(c => c.id === selectedCaseId);
          if (!exists) setSelectedCaseId(res.data[0].id);
        }
      } else {
        setSelectedCaseId(null);
      }
    } catch (err) {
      console.error("Could not connect to backend:", err);
      showNotification("Backend server is offline. Please start FastAPI.", true);
    }
  };

  const handleSelectRole = (roleKey, badge, pass) => {
    setTargetRole(roleKey);
    setLoginBadge(badge);
    setLoginPassword(pass);
    setViewMode("login");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginBadge || !loginPassword) return;

    setIsLoggingIn(true);
    const formData = new FormData();
    formData.append("badge_id", loginBadge);
    formData.append("password", loginPassword);

    try {
      const res = await axios.post(`${API_BASE}/login`, formData);
      setCurrentUser(res.data);
      showNotification(`Logged in as ${res.data.name}`);
      
      if (res.data.role === "fsl") {
        setActiveTab("evidence");
      } else if (res.data.role === "judge") {
        setActiveTab("audit");
      } else {
        setActiveTab("documents");
      }
      
      setRightWorkspaceMode("case_details");
      setViewMode("dashboard");
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Authentication Failed. Please check credentials.", true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setViewMode("home");
    showNotification("Logged out successfully.");
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;
  const currentRole = currentUser ? currentUser.role : null;

  const filteredCases = cases.filter(c => 
    c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const computeMasterAuditTrail = (c) => {
    if (!c) return [];
    const trail = [];

    trail.push({
      type: "CASE_CREATED",
      timestamp: c.created_at || "N/A",
      actor: "Station Officer",
      description: `Case ${c.case_number} registered in Central Database`,
      status: "Verified",
      is_valid: true
    });

    if (c.documents) {
      c.documents.forEach(d => {
        trail.push({
          type: "DOCUMENT_UPLOADED",
          timestamp: d.created_at || "N/A",
          actor: "Police Officer / Ingestion System",
          description: `Uploaded Document File '${d.title}'`,
          hash: d.file_hash,
          status: "Hashed & Sealed",
          is_valid: true
        });
      });
    }

    if (c.assets) {
      c.assets.forEach(a => {
        if (a.custody_history) {
          a.custody_history.forEach(h => {
            trail.push({
              type: "CUSTODY_HANDSHAKE",
              timestamp: h.timestamp || "N/A",
              actor: h.custodian || "System Handler",
              description: `[${a.name}] ${h.action}`,
              status: h.is_valid === false ? "FLAGGED TAMPERED" : "Integrity Validated",
              is_valid: h.is_valid !== false
            });
          });
        }
      });
    }

    return trail.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const masterAuditTrail = computeMasterAuditTrail(selectedCase);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (currentRole !== "constable" && currentRole !== "io") {
      showNotification("Access Denied: Only Police Officers can register new cases.", true);
      return;
    }
    if (!newCaseNumber || !newCaseTitle) return;

    const formData = new FormData();
    formData.append("case_number", newCaseNumber);
    formData.append("title", newCaseTitle);
    formData.append("description", newCaseDesc);

    try {
      const res = await axios.post(`${API_BASE}/cases`, formData);
      showNotification(`Case ${newCaseNumber} saved permanently to Database!`);
      setNewCaseNumber("");
      setNewCaseTitle("");
      setNewCaseDesc("");
      setSelectedCaseId(res.data.id);
      setRightWorkspaceMode("case_details");
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to create case", true);
    }
  };

  const handleDeleteCase = async (caseId, caseNumber) => {
    if (currentRole !== "constable" && currentRole !== "io") {
      showNotification("Access Denied: Only Police Officers can delete cases.", true);
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete case ${caseNumber} and all its documents from the database?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/cases/${caseId}`);
      showNotification(`Case ${caseNumber} permanently deleted from database.`);
      setSelectedCaseId(null);
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to delete case", true);
    }
  };

  const handleDeleteDocument = async (docId, docTitle) => {
    if (currentRole === "judge") {
      showNotification("Access Denied: Read-Only role cannot delete files.", true);
      return;
    }
    const confirmDelete = window.confirm(`Are you sure you want to delete the file '${docTitle}'? This will permanently remove it from the file store.`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/documents/${docId}`);
      showNotification(`Document '${docTitle}' deleted from database and file store.`);
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to delete document file", true);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (currentRole === "judge") {
      showNotification("Access Denied: Lawyers and Judges have Read-Only access.", true);
      return;
    }
    if (!selectedCase || !docTitle || !docFile) return;

    setIsUploadingDoc(true);
    const formData = new FormData();
    formData.append("case_id", selectedCase.id);
    formData.append("title", docTitle);
    formData.append("file", docFile);

    try {
      await axios.post(`${API_BASE}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification("Document uploaded, text extracted, and SHA-256 hash saved to Database!");
      setDocTitle("");
      setDocFile(null);
      const fileInput = document.getElementById("docFileInput");
      if (fileInput) fileInput.value = "";
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to upload document", true);
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleRegisterEvidence = async (e) => {
    e.preventDefault();
    if (currentRole === "judge") {
      showNotification("Access Denied: Read-Only role.", true);
      return;
    }
    if (!selectedCase || !assetName || !assetSeal || !assetWeight || !assetCustodian) return;

    const formData = new FormData();
    formData.append("case_id", selectedCase.id);
    formData.append("name", assetName);
    formData.append("serial_number", assetSerial || "N/A");
    formData.append("seal_id", assetSeal);
    formData.append("weight_grams", assetWeight);
    formData.append("current_custodian", assetCustodian);

    try {
      await axios.post(`${API_BASE}/evidence`, formData);
      showNotification(`Physical evidence '${assetName}' registered and baseline weight sealed in Database!`);
      setAssetName("");
      setAssetSerial("");
      setAssetSeal("");
      setAssetWeight("");
      setAssetCustodian("");
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to register physical evidence", true);
    }
  };

  const handleVerifyCustody = async (e) => {
    e.preventDefault();
    if (currentRole === "judge") {
      showNotification("Access Denied: Read-Only role.", true);
      return;
    }
    if (!verifyAssetId || !verifySeal || !verifyWeight || !verifyCustodian) return;

    const formData = new FormData();
    formData.append("scanned_seal_id", verifySeal);
    formData.append("measured_weight_grams", verifyWeight);
    formData.append("new_custodian", verifyCustodian);
    formData.append("destination_status", verifyDestination);

    try {
      const res = await axios.post(`${API_BASE}/evidence/${verifyAssetId}/verify-custody`, formData);
      if (res.data.success) {
        showNotification(`✓ Verification Passed: Physical weight (${res.data.details.measured_weight_g}g) matches Sealed Record!`);
      } else {
        showNotification(`⚠️ TAMPER ALERT: Measured (${res.data.details.measured_weight_g}g) does NOT match Sealed Baseline (${res.data.details.expected_weight_g}g)! Item flagged as tampered.`, true);
      }
      setVerifyAssetId("");
      setVerifySeal("");
      setVerifyWeight("");
      setVerifyCustodian("");
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Custody verification failed", true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans max-w-full overflow-x-hidden">
      
      {/* CLEAN GLOBAL HEADER */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between border-b border-slate-800 max-w-full">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode("home")}>
          <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
            <Shield className="h-6 w-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Police & Forensic Document Management System
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Database className="h-3 w-3" /> Database Active
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button 
              onClick={handleLogout} 
              className="bg-rose-700 hover:bg-rose-600 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 text-white font-semibold transition-colors shadow-sm"
              title="End session and lock system"
            >
              <LogOut className="h-3.5 w-3.5" /> Logout & Lock
            </button>
          ) : (
            <button 
              onClick={() => setViewMode("home")} 
              className="bg-blue-700 hover:bg-blue-600 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 text-white font-semibold transition-colors shadow-sm"
            >
              <Home className="h-3.5 w-3.5" /> Home Page
            </button>
          )}

          <button 
            onClick={fetchCases} 
            className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </header>

      {/* NOTIFICATION BANNERS */}
      {message && (
        <div className="bg-emerald-600 text-white text-center py-2.5 text-xs font-semibold shadow">
          {message}
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-600 text-white text-center py-2.5 text-xs font-semibold shadow animate-pulse">
          {errorMessage}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: HOME LANDING PAGE                                                */}
      {/* ========================================================================= */}
      {viewMode === "home" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
          
          <div className="text-center space-y-3 max-w-2xl">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Secure Digital Document Management & Tamper-Evident Evidence System
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Centralized digital repository for Police Stations, Forensic Science Labs, and Courts. 
              Select your operational role below to enter the secure authentication login screen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            
            <div 
              onClick={() => handleSelectRole("constable", "CONSTABLE101", "police123")}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-600 hover:shadow-lg cursor-pointer transition-all group flex items-start gap-4"
            >
              <div className="bg-blue-100 p-3.5 rounded-xl text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Building2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900">
                  👮 1. Police Constable / Station Officer
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  FIR Case Filing, Complaint Ingestion, SHA-256 Document Hashing & Physical Crime Scene Evidence Seizure.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Authenticate as Police Officer</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleSelectRole("io", "IO202", "io123")}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-600 hover:shadow-lg cursor-pointer transition-all group flex items-start gap-4"
            >
              <div className="bg-indigo-100 p-3.5 rounded-xl text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <UserCheck className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900">
                  🕵️ 2. Investigating Officer (IO)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Case Management, PDF Text Extraction Review, Witness Statement Ingestion & Charge Sheet Filing.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-indigo-600">
                  <span>Authenticate as IO</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleSelectRole("fsl", "FSL303", "fsl123")}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-teal-600 hover:shadow-lg cursor-pointer transition-all group flex items-start gap-4"
            >
              <div className="bg-teal-100 p-3.5 rounded-xl text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <Smartphone className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-900">
                  🔬 3. Forensic Lab Technician (FSL Expert)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Physical Evidence Receiving, Blind Scale Handshake, Weight/Seal Tamper Verification & FSL Analysis Upload.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-teal-600">
                  <span>Authenticate as FSL Expert</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleSelectRole("judge", "JUDGE404", "judge123")}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-purple-600 hover:shadow-lg cursor-pointer transition-all group flex items-start gap-4"
            >
              <div className="bg-purple-100 p-3.5 rounded-xl text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Eye className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-900">
                  ⚖️ 4. Judge / Lawyer / Prosecutor (Read-Only)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Judicial Inspection, Cryptographic SHA-256 Hash Seals, Custody Trail Audit & BSA Section 63 Certificate.
                </p>
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-purple-600">
                  <span>Authenticate as Court Reviewer</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: AUTHENTICATION / LOGIN SCREEN                                     */}
      {/* ========================================================================= */}
      {viewMode === "login" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full space-y-6 animate-fade-in">
          
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full space-y-6">
            
            <div className="text-center space-y-2">
              <div className="bg-slate-900 text-blue-400 p-3 rounded-2xl w-fit mx-auto shadow-md">
                <Lock className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Stakeholder Login & Authentication
              </h2>
              <p className="text-xs text-slate-500">
                Logging in for <strong className="text-blue-900 capitalize">{targetRole === 'constable' ? '👮 Police Constable' : targetRole === 'io' ? '🕵️ Investigating Officer' : targetRole === 'fsl' ? '🔬 FSL Lab Expert' : '⚖️ Judge / Lawyer'}</strong> persona.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge ID / Username</label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="text"
                    placeholder="e.g. CONSTABLE101, IO202, FSL303, JUDGE404"
                    value={loginBadge}
                    onChange={(e) => setLoginBadge(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
                <div className="relative">
                  <Key className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
                  <input 
                    type="password"
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-2.5 rounded-lg text-xs transition-colors shadow flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {isLoggingIn ? "Authenticating Credentials..." : "Authenticate & Open Workstation"}
              </button>
            </form>

            <button
              onClick={() => setViewMode("home")}
              className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← Back to Home Page Role Selection
            </button>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DASHBOARD WORKSPACE                                               */}
      {/* ========================================================================= */}
      {viewMode === "dashboard" && currentUser && (
        <div className="flex-1 flex gap-4 p-4 md:p-6 w-full max-w-full overflow-x-hidden">
          
          {/* ===================================================================== */}
          {/* LEFT COLUMN: PURE CASE DIRECTORY LIST                                 */}
          {/* ===================================================================== */}
          <div className="w-72 lg:w-80 bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4 shrink-0 max-h-[calc(100vh-100px)] sticky top-20">
            
            {/* Header with Search & Register Button for Police */}
            <div className="space-y-2 border-b border-slate-100 pb-3">
              <div className="flex justify-between items-center">
                <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                  <FolderOpen className="h-4 w-4 text-blue-600" /> Case Directory ({cases.length})
                </h2>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  DB Connected
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input 
                  type="text"
                  placeholder="Search FIR No. or Title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
              </div>

              {/* Register New Case Button on Left Side for Police Officers */}
              {(currentRole === "constable" || currentRole === "io") && (
                <button
                  onClick={() => setRightWorkspaceMode("create_case")}
                  className={`w-full text-xs font-bold py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                    rightWorkspaceMode === "create_case"
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <Plus className="h-3.5 w-3.5" /> Register New Case
                </button>
              )}
            </div>

            {/* Cases List */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {filteredCases.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl text-center">
                  <Database className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600 font-bold">No matching cases found.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {(currentRole === 'constable' || currentRole === 'io') 
                      ? 'Click Register New Case to add your first case.' 
                      : 'Case registration is managed by Police Officers.'}
                  </p>
                </div>
              ) : (
                filteredCases.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setRightWorkspaceMode("case_details");
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                      selectedCaseId === c.id && rightWorkspaceMode === "case_details"
                        ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-sm" 
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex-1 pr-2 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-mono font-bold text-blue-900">{c.case_number}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold border border-slate-200">
                          {c.documents?.length || 0} Docs
                        </span>
                        <span className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded font-semibold border border-teal-200">
                          {c.assets?.length || 0} Assets
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-800 truncate">{c.title}</h3>
                    </div>
                    
                    {/* Delete Case Option: ONLY visible for Police Officer roles */}
                    {(currentRole === "constable" || currentRole === "io") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCase(c.id, c.case_number);
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete Case (Police Officer Only)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>

          {/* ===================================================================== */}
          {/* RIGHT COLUMN: MAIN WORKSPACE                                          */}
          {/* ===================================================================== */}
          <div className="flex-1 min-w-0 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-5">
            
            {/* Custom Role Banner Header */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
              currentRole === 'constable' 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : currentRole === 'io'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : currentRole === 'fsl'
                ? 'bg-teal-50 border-teal-200 text-teal-900'
                : 'bg-purple-50 border-purple-200 text-purple-900'
            }`}>
              <div className="flex items-center gap-2 truncate">
                {currentRole === 'constable' && <Building2 className="h-4 w-4 text-blue-700 shrink-0" />}
                {currentRole === 'io' && <UserCheck className="h-4 w-4 text-indigo-700 shrink-0" />}
                {currentRole === 'fsl' && <Smartphone className="h-4 w-4 text-teal-700 shrink-0" />}
                {currentRole === 'judge' && <Eye className="h-4 w-4 text-purple-700 shrink-0" />}
                <span className="truncate">
                  {currentRole === 'constable' && '👮 POLICE CONSTABLE WORKSPACE: FIR Ingestion & Evidence Seizure'}
                  {currentRole === 'io' && '🕵️ INVESTIGATING OFFICER (IO) WORKSPACE: Case Management & Text Extraction'}
                  {currentRole === 'fsl' && '🔬 FORENSIC LAB TECHNICIAN WORKSPACE: Blind Scale Verification & FSL Analysis'}
                  {currentRole === 'judge' && '⚖️ COURTROOM JUDICIAL WORKSPACE: Read-Only Hashes & Master Audit Inspection'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-normal opacity-80 shrink-0">
                {currentUser ? currentUser.name : ''}
              </span>
            </div>

            {/* MODE A: REGISTER NEW CASE FORM ON THE RIGHT SIDE */}
            {rightWorkspaceMode === "create_case" && (currentRole === "constable" || currentRole === "io") ? (
              <form onSubmit={handleCreateCase} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Plus className="h-4 w-4 text-blue-600" /> Register New Case in Database (Police Station Officer Form)
                  </h3>
                  {selectedCase && (
                    <button
                      type="button"
                      onClick={() => setRightWorkspaceMode("case_details")}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      ← Back to Case Workspace
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Case Number / FIR No.</label>
                    <input 
                      type="text" 
                      placeholder="e.g. FIR-2026-001" 
                      value={newCaseNumber} 
                      onChange={(e) => setNewCaseNumber(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Case Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Theft of Laptop at Railway Station" 
                      value={newCaseTitle} 
                      onChange={(e) => setNewCaseTitle(e.target.value)}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Incident Summary & Complainant Details</label>
                  <textarea 
                    placeholder="Describe incident location, date, time, complainant info, and initial investigation summary..." 
                    value={newCaseDesc} 
                    onChange={(e) => setNewCaseDesc(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 h-28 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold py-3 rounded-lg transition-colors shadow flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Save Case to Central Database & Open Workspace
                </button>
              </form>
            ) : selectedCase ? (
              /* MODE B: CASE WORKSPACE ON THE RIGHT SIDE */
              <>
                {/* Selected Case Header */}
                <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                  <div className="flex-1 pr-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {selectedCase.case_number}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Added: {selectedCase.created_at}</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1 truncate">{selectedCase.title}</h2>
                    {selectedCase.description && (
                      <p className="text-xs text-slate-600 mt-1">{selectedCase.description}</p>
                    )}
                  </div>
                  
                  {/* Delete Case Button: ONLY visible for Police Officer roles */}
                  {(currentRole === "constable" || currentRole === "io") && (
                    <button
                      onClick={() => handleDeleteCase(selectedCase.id, selectedCase.case_number)}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
                      title="Permanently delete this case from the database"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete Case
                    </button>
                  )}
                </div>

                {/* Workspace Navigation Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveTab("documents")}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "documents"
                        ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                    Documents ({selectedCase.documents?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("evidence")}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "evidence"
                        ? "bg-white text-teal-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                    Evidence ({selectedCase.assets?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("audit")}
                    className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "audit"
                        ? "bg-white text-purple-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <History className="h-3.5 w-3.5 text-purple-600" />
                    Audit Trail ({masterAuditTrail.length})
                  </button>
                </div>

                {/* TAB 1: DOCUMENTS & PDF EXTRACTION */}
                {activeTab === "documents" && (
                  <div className="space-y-5">
                    {/* Upload Document Form - Hidden for Judge/Lawyer */}
                    {currentRole !== "judge" ? (
                      <form onSubmit={handleUploadDocument} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                          <Upload className="h-4 w-4 text-blue-600" /> Upload Case Document (PDF / TXT / Image)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <input 
                            type="text" 
                            placeholder="Document Title (e.g. Official FIR.pdf)" 
                            value={docTitle} 
                            onChange={(e) => setDocTitle(e.target.value)}
                            className="text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                          <input 
                            id="docFileInput"
                            type="file" 
                            accept=".pdf,.txt,.doc,.docx,.png,.jpg,.jpeg"
                            onChange={(e) => setDocFile(e.target.files[0])}
                            className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white cursor-pointer max-w-full"
                            required
                          />
                        </div>
                        <button 
                          type="submit"
                          disabled={isUploadingDoc}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-1.5 shadow"
                        >
                          <Upload className="h-3.5 w-3.5" /> 
                          {isUploadingDoc ? "Saving & Extracting Text..." : "Upload File & Compute SHA-256 Hash"}
                        </button>
                      </form>
                    ) : (
                      <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 text-purple-900 text-xs font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-700" />
                        <span><strong>Lawyer / Court View:</strong> Upload forms are disabled. You can inspect stored documents, SHA-256 hashes, and extracted text below.</span>
                      </div>
                    )}

                    {/* Uploaded Documents List with Perfect Vertical Stack Alignment */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
                        <span>Stored Documents ({selectedCase.documents?.length || 0})</span>
                        <span className="text-[10px] text-slate-400 font-normal">Stored in backend/uploads/</span>
                      </h3>

                      {(!selectedCase.documents || selectedCase.documents.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                          No documents uploaded for this case yet.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCase.documents.map((d) => (
                            <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                              {/* Row 1: Document Title & Action Buttons */}
                              <div className="flex justify-between items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">{d.title}</span>
                                
                                <div className="flex items-center gap-2 shrink-0">
                                  {/* View Original Document File */}
                                  <a
                                    href={`${API_BASE}/documents/${d.id}/file`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 shadow-sm transition-colors"
                                    title="View Original Uploaded Document File in new tab"
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                    View Original Document
                                  </a>

                                  {d.extracted_text && (
                                    <button
                                      onClick={() => setExpandedDocId(expandedDocId === d.id ? null : d.id)}
                                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1 shadow-sm"
                                    >
                                      <FileCode className="h-3.5 w-3.5" />
                                      {expandedDocId === d.id ? "Hide Text" : "View Extracted Text"}
                                      {expandedDocId === d.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>
                                  )}

                                  {/* Delete Document File Button */}
                                  {currentRole !== "judge" && (
                                    <button
                                      onClick={() => handleDeleteDocument(d.id, d.title)}
                                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors shadow-sm"
                                      title="Delete Misuploaded File"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Row 2: SHA-256 Hash Badge Cleanly Placed Below */}
                              <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                                    SHA-256 Cryptographic Hash Seal:
                                  </span>
                                  <span className="font-mono text-[11px] text-slate-800 break-all select-all font-semibold">
                                    {d.file_hash}
                                  </span>
                                </div>
                              </div>

                              {/* Row 3: Extracted Text Box */}
                              {expandedDocId === d.id && d.extracted_text && (
                                <div className="mt-2 bg-white p-3 rounded-lg border border-blue-200">
                                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                                    Extracted Text (from PDF/Document):
                                  </span>
                                  <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100">
                                    {d.extracted_text}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: PHYSICAL EVIDENCE & BLIND FSL CUSTODY */}
                {activeTab === "evidence" && (
                  <div className="space-y-6">
                    {/* Log Seizure Form - Visible for Police Constable & IO */}
                    {(currentRole === "constable" || currentRole === "io") && (
                      <form onSubmit={handleRegisterEvidence} className="bg-teal-50/60 p-4 rounded-xl border border-teal-200 space-y-3">
                        <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wide flex items-center gap-1.5">
                          <Plus className="h-4 w-4 text-teal-700" /> Log Evidence Seizure (Physical Asset)
                        </h3>
                        <p className="text-[11px] text-teal-800">
                          The seizing officer records the baseline weight on the crime scene scale. This value is cryptographically locked and hidden from subsequent handlers to prevent faked handovers.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <input 
                            type="text" 
                            placeholder="Item Name (e.g. Seized Samsung S25)" 
                            value={assetName} 
                            onChange={(e) => setAssetName(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                            required
                          />
                          <input 
                            type="text" 
                            placeholder="IMEI / Serial Number" 
                            value={assetSerial} 
                            onChange={(e) => setAssetSerial(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                          />
                          <input 
                            type="text" 
                            placeholder="Security Seal ID (e.g. SEAL-223344)" 
                            value={assetSeal} 
                            onChange={(e) => setAssetSeal(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                            required
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Initial Baseline Weight in Grams (e.g. 123.3)" 
                            value={assetWeight} 
                            onChange={(e) => setAssetWeight(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                            required
                          />
                        </div>
                        <input 
                          type="text" 
                          placeholder="Seizing Officer Name (e.g. Inspector Amit Sharma)" 
                          value={assetCustodian} 
                          onChange={(e) => setAssetCustodian(e.target.value)}
                          className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
                          required
                        />
                        <button 
                          type="submit"
                          className="w-full bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow"
                        >
                          Save & Seal Physical Fingerprint in Database
                        </button>
                      </form>
                    )}

                    {/* Blind FSL Handshake Form - Visible for FSL Expert */}
                    {selectedCase.assets && selectedCase.assets.length > 0 && currentRole === "fsl" && (
                      <form onSubmit={handleVerifyCustody} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                            <UserCheck className="h-4 w-4 text-blue-600" /> Blind FSL Custody Handshake (Anti-Tamper Check)
                          </h3>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Blind Audit Mode
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          To prevent fraud, the baseline weight is kept hidden. The receiving technician <strong>must physically weigh the package on their lab scale</strong> and enter the measured value. The server validates if it matches the sealed commitment within ±0.5g tolerance.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          <select
                            value={verifyAssetId}
                            onChange={(e) => setVerifyAssetId(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          >
                            <option value="">-- Select Physical Evidence --</option>
                            {selectedCase.assets.map(a => (
                              <option key={a.id} value={a.id}>{a.name} (ID: #{a.id})</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            placeholder="Scan / Enter Physical Seal ID on Bag" 
                            value={verifySeal} 
                            onChange={(e) => setVerifySeal(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                          <input 
                            type="number" 
                            step="0.01"
                            placeholder="Actual Measured Scale Weight in Grams" 
                            value={verifyWeight} 
                            onChange={(e) => setVerifyWeight(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                          <input 
                            type="text" 
                            placeholder="Receiver Name (e.g. Dr. Verma - FSL)" 
                            value={verifyCustodian} 
                            onChange={(e) => setVerifyCustodian(e.target.value)}
                            className="p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                            required
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-600 font-semibold text-[11px]">Destination Location:</span>
                          <select
                            value={verifyDestination}
                            onChange={(e) => setVerifyDestination(e.target.value)}
                            className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none"
                          >
                            <option value="In_Forensics_Lab">Forensics Science Laboratory (FSL)</option>
                            <option value="In_Vault">Central Police Station Vault</option>
                          </select>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-blue-800 hover:bg-blue-900 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow"
                        >
                          Submit Physical Measurement & Verify Against Sealed Record
                        </button>
                      </form>
                    )}

                    {/* Registered Evidence Items List */}
                    <div className="space-y-3">
                      <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center justify-between">
                        <span>Physical Evidence Registry ({selectedCase.assets?.length || 0})</span>
                      </h3>

                      {(!selectedCase.assets || selectedCase.assets.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                          No physical evidence seized for this case yet. Use the form above to register an item.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {selectedCase.assets.map((a) => (
                            <div key={a.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-sm text-slate-900">{a.name}</span>
                                  <p className="text-slate-500 font-mono text-[10px] mt-0.5">
                                    SN/IMEI: {a.serial_number}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                  a.status === "FLAGGED_TAMPERED"
                                    ? "bg-rose-100 text-rose-800 border-rose-300 animate-pulse"
                                    : "bg-teal-100 text-teal-800 border-teal-300"
                                }`}>
                                  {a.status.replace("_", " ")}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block flex items-center gap-1">
                                    <Lock className="h-2.5 w-2.5 text-blue-600" /> Baseline Weight
                                  </span>
                                  <span className="font-mono text-slate-600 text-xs flex items-center gap-1">
                                    🔒 <span className="italic text-slate-500 font-sans">Sealed in Database</span>
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Current Custodian</span>
                                  <span className="font-semibold text-slate-800">{a.current_custodian}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: AUDIT TRAIL & LEGAL LOGS */}
                {activeTab === "audit" && (
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 flex justify-between items-center">
                      <div>
                        <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                          <History className="h-4 w-4 text-purple-700" /> Master Legal Audit Trail
                        </h3>
                        <p className="text-[11px] text-purple-700 mt-0.5">
                          Complete chronological audit log of all case creation events, document upload hashes, and physical custody transfers.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-white text-purple-900 px-2.5 py-1 rounded border border-purple-300 shadow-sm">
                        {masterAuditTrail.length} Total Audit Records
                      </span>
                    </div>

                    {masterAuditTrail.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-lg text-center">
                        No activity recorded for this case yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {masterAuditTrail.map((event, idx) => (
                          <div 
                            key={idx} 
                            className={`p-4 rounded-xl border space-y-2 shadow-sm ${
                              event.is_valid === false 
                                ? "bg-rose-50 border-rose-300" 
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            {/* Top Header Row: Event Type, Timestamp, Status Badge */}
                            <div className="flex justify-between items-center gap-2 border-b border-slate-200/70 pb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded font-mono shrink-0 uppercase tracking-wide ${
                                  event.type === "CASE_CREATED" 
                                    ? "bg-blue-100 text-blue-800 border border-blue-200" 
                                    : event.type === "DOCUMENT_UPLOADED"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : event.is_valid === false
                                    ? "bg-rose-200 text-rose-900 border border-rose-300"
                                    : "bg-teal-100 text-teal-800 border border-teal-200"
                                }`}>
                                  {event.type}
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate">
                                  {event.description}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[11px] font-mono text-slate-400 font-medium whitespace-nowrap">
                                  {event.timestamp}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded whitespace-nowrap ${
                                  event.is_valid === false
                                    ? "bg-rose-600 text-white"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                }`}>
                                  {event.status}
                                </span>
                              </div>
                            </div>

                            {/* Handler / Actor Info */}
                            <p className="text-[11px] text-slate-600">
                              Actor / Handler: <strong className="text-slate-800">{event.actor}</strong>
                            </p>

                            {/* SHA-256 Hash Box if present */}
                            {event.hash && (
                              <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-2">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                                    Cryptographic SHA-256 Hash Seal:
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-800 break-all select-all font-semibold">
                                    {event.hash}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic py-16">
                <FolderOpen className="h-10 w-10 text-slate-300 mb-2" />
                Select a case on the left or click "Register New Case" to create your first case.
              </div>
            )}
          </div>

        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-slate-400 text-xs">
        Police & Forensic Document Management System
      </footer>
    </div>
  );
}

export default App;
