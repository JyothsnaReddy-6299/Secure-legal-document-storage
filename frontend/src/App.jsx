import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Plus, Upload, Shield, RefreshCw, CheckCircle2, 
  FolderOpen, Database, ChevronDown, ChevronUp, FileCode,
  Scale, ShieldAlert, Clock, AlertTriangle, ArrowRight, UserCheck, Smartphone, Trash2, Lock
} from 'lucide-react';

const API_BASE = "http://localhost:8000/api";

function App() {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [activeTab, setActiveTab] = useState("stage1");
  const [expandedDocId, setExpandedDocId] = useState(null);
  
  // Create Case Form
  const [newCaseNumber, setNewCaseNumber] = useState("");
  const [newCaseTitle, setNewCaseTitle] = useState("");
  const [newCaseDesc, setNewCaseDesc] = useState("");

  // Stage 1: Upload Document Form
  const [docTitle, setDocTitle] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Stage 2: Seize Physical Evidence Form
  const [assetName, setAssetName] = useState("");
  const [assetSerial, setAssetSerial] = useState("");
  const [assetSeal, setAssetSeal] = useState("");
  const [assetWeight, setAssetWeight] = useState("");
  const [assetCustodian, setAssetCustodian] = useState("");

  // Stage 2: FSL Blind Custody Handshake Form
  const [verifyAssetId, setVerifyAssetId] = useState("");
  const [verifySeal, setVerifySeal] = useState("");
  const [verifyWeight, setVerifyWeight] = useState("");
  const [verifyCustodian, setVerifyCustodian] = useState("");
  const [verifyDestination, setVerifyDestination] = useState("In_Forensics_Lab");

  // Notification banners
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

  const selectedCase = cases.find(c => c.id === selectedCaseId) || null;

  // Create a brand new Case in the Database
  const handleCreateCase = async (e) => {
    e.preventDefault();
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
      fetchCases();
    } catch (err) {
      showNotification(err.response?.data?.detail || "Failed to create case", true);
    }
  };

  // Permanently delete a case from the Database
  const handleDeleteCase = async (caseId, caseNumber) => {
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

  // Stage 1: Upload and Hash Document (PDF / TXT / Image)
  const handleUploadDocument = async (e) => {
    e.preventDefault();
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

  // Stage 2: Register Seized Physical Evidence
  const handleRegisterEvidence = async (e) => {
    e.preventDefault();
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

  // Stage 2: FSL Blind Custody Handshake & Anti-Tamper Verification
  const handleVerifyCustody = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
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
              <span>•</span>
              <span>Stage 1 (Case & Files) & Stage 2 (Physical Evidence Custody)</span>
            </p>
          </div>
        </div>
        <button 
          onClick={fetchCases} 
          className="bg-slate-800 hover:bg-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-200 border border-slate-700 transition-colors shadow-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Database
        </button>
      </header>

      {/* Live System Notifications */}
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

      {/* Main 2-Column Interface */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 max-w-7xl mx-auto w-full">
        
        {/* Left Column: Database Case Selector + Add Case Form */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4 text-blue-600" /> Case Registry ({cases.length})
            </h2>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              Persistent Storage
            </span>
          </div>

          {/* Cases List */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-80">
            {cases.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 p-6 rounded-xl text-center">
                <Database className="h-7 w-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-bold">Your database is currently empty.</p>
                <p className="text-[11px] text-slate-400 mt-1">Use the form below to create your first real case.</p>
              </div>
            ) : (
              cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                    selectedCaseId === c.id 
                      ? "border-blue-600 bg-blue-50/60 ring-1 ring-blue-600 shadow-sm" 
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex-1 pr-2">
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
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCase(c.id, c.case_number);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                    title="Delete Case"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Case Form */}
          <form onSubmit={handleCreateCase} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-auto space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
              <Plus className="h-3.5 w-3.5 text-blue-600" /> Create New Case
            </h3>
            <input 
              type="text" 
              placeholder="Case Number (e.g. FIR-2026-001)" 
              value={newCaseNumber} 
              onChange={(e) => setNewCaseNumber(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
            <input 
              type="text" 
              placeholder="Case Title (e.g. Theft of Laptop)" 
              value={newCaseTitle} 
              onChange={(e) => setNewCaseTitle(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
            />
            <textarea 
              placeholder="Incident Summary / Location details..." 
              value={newCaseDesc} 
              onChange={(e) => setNewCaseDesc(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 h-14 resize-none"
            />
            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors shadow"
            >
              Save Case to Database
            </button>
          </form>
        </div>

        {/* Right Column: Stage 1 & Stage 2 Workspaces */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-5">
          {selectedCase ? (
            <>
              {/* Selected Case Header with Delete Button */}
              <div className="border-b border-slate-200 pb-3 flex justify-between items-start">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {selectedCase.case_number}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Added: {selectedCase.created_at}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{selectedCase.title}</h2>
                  {selectedCase.description && (
                    <p className="text-xs text-slate-600 mt-1">{selectedCase.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => handleDeleteCase(selectedCase.id, selectedCase.case_number)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Permanently delete this case from the database"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Case
                </button>
              </div>

              {/* Stage 1 & Stage 2 Navigation Tabs */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("stage1")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "stage1"
                      ? "bg-white text-blue-900 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 text-blue-600" />
                  Stage 1: Documents & PDF Ingestion ({selectedCase.documents?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("stage2")}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === "stage2"
                      ? "bg-white text-teal-900 shadow-sm border border-slate-200"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 text-teal-600" />
                  Stage 2: Physical Evidence & Custody ({selectedCase.assets?.length || 0})
                </button>
              </div>

              {/* TAB 1: STAGE 1 (DOCUMENTS & PDF EXTRACTION) */}
              {activeTab === "stage1" && (
                <div className="space-y-5">
                  {/* Upload Document Form */}
                  <form onSubmit={handleUploadDocument} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-blue-600" /> Upload Case File (PDF / TXT / Image)
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
                        className="text-xs p-1.5 border border-slate-300 rounded-lg bg-white cursor-pointer"
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

                  {/* Uploaded Documents List */}
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
                          <div key={d.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold text-xs text-slate-900 block">{d.title}</span>
                                <span className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 w-fit mt-1">
                                  <CheckCircle2 className="h-3 w-3 text-emerald-600" /> SHA-256: {d.file_hash}
                                </span>
                              </div>
                              {d.extracted_text && (
                                <button
                                  onClick={() => setExpandedDocId(expandedDocId === d.id ? null : d.id)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex items-center gap-1"
                                >
                                  <FileCode className="h-3.5 w-3.5" />
                                  {expandedDocId === d.id ? "Hide Text" : "View Extracted Text"}
                                  {expandedDocId === d.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                </button>
                              )}
                            </div>

                            {/* Extracted Text Box */}
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

              {/* TAB 2: STAGE 2 (PHYSICAL EVIDENCE & BLIND FSL CUSTODY) */}
              {activeTab === "stage2" && (
                <div className="space-y-6">
                  {/* Register Evidence Seizure Form */}
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

                  {/* Blind FSL Custody Handshake Form */}
                  {selectedCase.assets && selectedCase.assets.length > 0 && (
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

                  {/* Registered Evidence Items List (With Sealed Weights) */}
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

                            {/* Custody History Log */}
                            {a.custody_history && a.custody_history.length > 0 && (
                              <div className="border-t border-slate-200 pt-2.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                                  Custody Chain History ({a.custody_history.length} Handshakes):
                                </span>
                                <div className="space-y-1.5">
                                  {a.custody_history.map((h, i) => (
                                    <div 
                                      key={i} 
                                      className={`text-[10px] p-2.5 rounded-lg border flex flex-col gap-1 ${
                                        h.is_valid === false
                                          ? "bg-rose-50 border-rose-300 text-rose-900"
                                          : "bg-white border-slate-200 text-slate-700"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center font-semibold">
                                        <span className={h.is_valid === false ? "text-rose-700 font-bold" : "text-slate-900"}>
                                          {h.action}
                                        </span>
                                        <span className="font-mono text-slate-400 text-[9px]">{h.timestamp}</span>
                                      </div>
                                      <div className="flex justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                                        <span>Custodian: <strong>{h.custodian}</strong></span>
                                        <span className="font-mono text-slate-400">
                                          {i === 0 ? "🔒 Baseline Sealed" : `Handover Reading: ${h.weight_g}g`}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-xs italic py-16">
              <FolderOpen className="h-10 w-10 text-slate-300 mb-2" />
              Create or select a case on the left to view files and evidence.
            </div>
          )}
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-slate-400 text-xs">
        SIH 26190 • Stage 1 & Stage 2 Blind Verification Architecture
      </footer>
    </div>
  );
}

export default App;
