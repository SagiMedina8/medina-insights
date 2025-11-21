import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Clock, CheckCircle2, FileAudio, UploadCloud, ChevronRight, Menu, X, History, LayoutDashboard, LogOut, Trash2 } from "lucide-react";
import { Recording } from "@/types/recording";
import { uploadFileToBackend, getRecordings, deleteRecording } from "@/services/api";

// רשימת הפרסונות לבחירה
const PERSONA_OPTIONS = [
  { value: 'FOUNDER', label: 'Founder (Business & Staff)' },
  { value: 'DESIGNER', label: 'Designer (Style & Trends)' },
  { value: 'FITTER', label: 'Fitter (Measurements & Alterations)' },
  { value: 'SALES', label: 'Sales (Budget & Closing)' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form States
  const [file, setFile] = useState<File | null>(null);
  const [recordingName, setRecordingName] = useState("");
  const [context, setContext] = useState("");
  const [selectedPersona, setSelectedPersona] = useState("FOUNDER"); // ברירת מחדל
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- פונקציה לטעינת נתונים ---
  const fetchRecordings = async () => {
    try {
      const data = await getRecordings("test-employee-001");
      if (data && Array.isArray(data)) {
        setRecordings(data);
      }
    } catch (err) {
      console.error("Failed to load recordings", err);
    }
  };

  // --- Polling (טעינה כל 5 שניות) ---
  useEffect(() => {
    fetchRecordings(); 
    const interval = setInterval(fetchRecordings, 5000);
    return () => clearInterval(interval);
  }, []);

  // --- מחיקת הקלטה ---
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); 
    if (confirm("Are you sure you want to delete this analysis?")) {
      const success = await deleteRecording(id);
      if (success) {
        setRecordings(prev => prev.filter(r => r.id !== id));
      } else {
        alert("Failed to delete.");
      }
    }
  };

  // --- העלאת קובץ ---
  const handleRealUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress(10);

    // שליחה לשרת עם הפרסונה שנבחרה
    uploadFileToBackend(file, "test-employee-001", context, selectedPersona)
      .then(() => {
        console.log("Upload started");
        fetchRecordings();
      })
      .catch((e) => console.error("Upload error:", e));
      
    setUploadProgress(100); 
    
    // יצירת שורה זמנית בטבלה לתחושת מיידיות
    const tempRecording: Recording = {
        id: "temp-" + Date.now(),
        name: recordingName || file.name,
        created_at: new Date().toISOString(),
        status: "PROCESSING",
        persona: selectedPersona as any
    };
    setRecordings(prev => [tempRecording, ...prev]);

    alert("הקובץ נשלח לעיבוד! הרשימה תתעדכן אוטומטית.");

    // איפוס וסגירה
    setTimeout(() => {
      setIsModalOpen(false);
      setFile(null);
      setRecordingName("");
      setContext("");
      setSelectedPersona("FOUNDER"); // איפוס לברירת מחדל
      setIsUploading(false);
      setUploadProgress(0);
    }, 500);
  };

  // --- Components ---

  const SidebarContent = () => (
    <div className="h-full flex flex-col p-6 bg-[#FDFCF8] border-r border-border">
      <div className="flex items-center gap-3 mb-12">
        <img src="/favicon.svg" alt="Medina" className="h-8 w-auto" />
        <span className="text-lg font-bold tracking-tight uppercase">Medina</span>
      </div>
      <nav className="space-y-2 flex-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 bg-black text-white text-xs font-bold uppercase tracking-wide hover:bg-[#333] transition-colors">
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>
      </nav>
      <div className="mt-auto pt-6 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-8 bg-[#E6E4DC] flex items-center justify-center font-bold text-xs">SM</div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">Sagi Medina</span>
            <span className="text-[10px] text-muted-foreground uppercase">Founder</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex">
      <aside className="hidden md:block w-64 fixed inset-y-0 z-50">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#FDFCF8]/90 backdrop-blur-md border-b border-border z-40 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="Medina" className="h-6 w-auto" />
          <span className="text-sm font-bold tracking-tight uppercase">Medina</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16">
          <SidebarContent />
        </div>
      )}

      <main className="flex-1 md:ml-64 p-6 md:p-12 pt-24 md:pt-12 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tighter mb-2">Extractions</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-md">Manage your audio insights.</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="brutalist-button flex items-center justify-center gap-2 w-full md:w-auto">
            <Plus className="w-4 h-4" /> New Extraction
          </button>
        </div>

        {/* --- RECORDINGS LIST --- */}
        <div className="bg-white border border-border">
          <div className="hidden md:grid grid-cols-12 px-6 py-4 border-b border-border bg-[#FAFAF8] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-5">Recording Name</div>
            <div className="col-span-3">Date</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-1">Actions</div>
          </div>

          <div className="divide-y divide-border">
            <AnimatePresence>
            {recordings.length === 0 && (
                <div className="p-8 text-center text-gray-400 text-sm">No recordings found yet. Start a new extraction.</div>
            )}
            {recordings.map((item) => (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                key={item.id} 
                onClick={() => item.status === 'DONE' && navigate(`/insight/${item.id}`)}
                className="group cursor-pointer hover:bg-[#F9F9F9] transition-colors"
              >
                <div className="hidden md:grid grid-cols-12 px-6 py-5 items-center">
                  <div className="col-span-5 font-medium flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center border border-border bg-[#FDFCF8]">
                      <FileAudio className="w-4 h-4 text-gray-400" />
                    </div>
                    {item.name}
                  </div>
                  <div className="col-span-3 text-sm text-muted-foreground font-mono">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-3">
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="col-span-1 flex justify-end items-center gap-3">
                     <button 
                        onClick={(e) => handleDelete(e, item.id)}
                        className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                        title="Delete"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                     <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black" />
                  </div>
                </div>
                
                {/* Mobile View */}
                <div className="md:hidden p-5 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <FileAudio className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-sm">{item.name}</span>
                        </div>
                        <button onClick={(e) => handleDelete(e, item.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        <StatusBadge status={item.status} />
                    </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-background w-full max-w-lg border border-border shadow-2xl p-0 flex flex-col max-h-[90vh]">
             <div className="px-6 py-5 border-b border-border flex justify-between bg-white">
               <h2 className="text-lg font-bold">New Extraction</h2>
               <button onClick={() => setIsModalOpen(false)}>✕</button>
             </div>
             <div className="p-6 space-y-6 bg-white overflow-y-auto">
                
                {/* File Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Audio File</label>
                    {!file ? (
                      <div className="border border-dashed border-gray-300 bg-[#FAFAF8] p-6 flex flex-col items-center gap-3 hover:border-black transition-all relative text-center">
                        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="audio/*" />
                        <UploadCloud className="w-8 h-8 text-gray-300" /><span className="text-sm font-medium">Tap to upload</span>
                      </div>
                    ) : (
                       <div className="flex justify-between p-4 bg-gray-50 border items-center">
                           <div className="flex items-center gap-3 overflow-hidden">
                               <FileAudio className="w-5 h-5 text-black" />
                               <span className="truncate text-sm font-medium">{file.name}</span>
                           </div>
                           <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                       </div>
                    )}
                </div>
                
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Recording Name</label>
                    <input type="text" value={recordingName} onChange={e => setRecordingName(e.target.value)} className="brutalist-input" placeholder="e.g. Meeting with Sarah" />
                </div>

                {/* Context Input */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Additional Context</label>
                    <textarea rows={2} value={context} onChange={e => setContext(e.target.value)} className="brutalist-input resize-none" placeholder="Focus points..." />
                </div>

                {/* Persona Selection Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Analysis Perspective</label>
                  <div className="relative">
                    <select 
                      value={selectedPersona}
                      onChange={(e) => setSelectedPersona(e.target.value)}
                      className="brutalist-input appearance-none cursor-pointer pr-10"
                    >
                      {PERSONA_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 rotate-90 text-gray-400" />
                    </div>
                  </div>
                </div>

             </div>
             <div className="p-5 border-t bg-[#FAFAF8] flex justify-end">
                {isUploading ? (
                    <span className="text-xs font-bold uppercase animate-pulse">Uploading...</span>
                ) : (
                    <button onClick={handleRealUpload} disabled={!file} className="bg-black text-white px-6 py-3 text-xs font-bold uppercase disabled:opacity-50">Start Process</button>
                )}
             </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => (
  <div className={`inline-flex items-center gap-2 px-2 py-1 border text-[10px] font-bold uppercase tracking-wider ${status === "DONE" ? "border-green-200 bg-green-50 text-green-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
    {status === "DONE" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
    {status}
  </div>
);

export default Dashboard;