import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { getAnalysisDetails } from "@/services/api";

const InsightView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      setLoading(true);
      const result = await getAnalysisDetails(id);
      
      if (result) {
        setData(result);
      } else {
        setError(true);
      }
      setLoading(false);
    };

    loadData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-sm font-mono text-muted-foreground">
      <div className="animate-pulse">Loading Analysis...</div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <h2 className="text-xl font-bold">Analysis Not Found</h2>
      <button onClick={() => navigate("/dashboard")} className="text-sm underline">Back to Dashboard</button>
    </div>
  );

  // --- חילוץ והכנת הנתונים ---
  let insights: any = {};
  try {
      if (typeof data.raw_insight_json === 'string') {
          insights = JSON.parse(data.raw_insight_json);
      } else {
          insights = data.raw_insight_json || {};
      }
  } catch (e) {
      console.error("Failed to parse insights JSON", e);
  }

  const actionItems = insights.action_items || [];
  
  // טיפול בסגמנטים של התמלול
  let segments = [];
  try {
      if (typeof data.segments === 'string') {
          segments = JSON.parse(data.segments);
      } else {
          segments = data.segments || [];
      }
  } catch (e) {
      console.error("Failed to parse segments", e);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header - Sticky & Blur */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <button 
            onClick={() => navigate("/dashboard")} 
            className="flex items-center gap-2 mb-4 text-muted-foreground hover:text-black transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-wide text-xs">Back to Dashboard</span>
          </button>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tighter mb-2">{insights.title || data.name}</h1>
              <div className="flex gap-3 text-xs font-mono text-muted-foreground">
                <span>{new Date(data.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="uppercase text-black font-bold">{data.persona} View</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3 h-3" />
              {data.status}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-8 py-12 space-y-8">
        
        {/* Executive Summary */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="brutalist-card"
        >
          <h2 className="text-lg font-bold mb-4 uppercase tracking-wide border-b border-border pb-2">Executive Summary</h2>
          <p className="text-gray-600 leading-relaxed text-right" dir="rtl">
            {insights.main_summary || data.main_summary || "No summary available."}
          </p>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Action Items */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="brutalist-card"
          >
            <h2 className="text-lg font-bold mb-6 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2 h-2 bg-black"></span> Action Items
            </h2>
            <ul className="space-y-4" dir="rtl">
              {actionItems.length > 0 ? actionItems.map((item: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm items-start text-right">
                  <span className="font-mono text-gray-400 text-xs pt-0.5 ml-2">0{i+1}</span>
                  <span>{item}</span>
                </li>
              )) : <p className="text-sm text-gray-400 text-right">No action items detected.</p>}
            </ul>
          </motion.section>

          {/* AI Category / Sentiment */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="brutalist-card bg-[#1A1A1A] text-white border-black"
          >
            <h2 className="text-lg font-bold mb-6 uppercase tracking-wide text-white flex items-center gap-2">
               <span className="w-2 h-2 bg-red-500 animate-pulse"></span> Insights
            </h2>
            <div className="space-y-4">
               <div>
                 <span className="text-xs uppercase text-gray-500 tracking-wider">Category</span>
                 <p className="text-lg font-mono">{insights.category || "General"}</p>
               </div>
               <div>
                 <span className="text-xs uppercase text-gray-500 tracking-wider">Sentiment</span>
                 <p className="text-lg font-mono text-green-400">{insights.sentiment || "Neutral"}</p>
               </div>
               {insights.priority && (
                   <div>
                     <span className="text-xs uppercase text-gray-500 tracking-wider">Priority</span>
                     <p className="text-lg font-mono text-yellow-400">{insights.priority}</p>
                   </div>
               )}
            </div>
          </motion.section>
        </div>

        {/* Transcript */}
        <motion.section 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="brutalist-card bg-[#fafaf8]"
        >
           <h2 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-400">Transcript</h2>
           <div className="space-y-4" dir="rtl">
             {segments.length > 0 ? (
               segments.map((seg: any, i: number) => (
                 <div key={i} className="flex gap-4 text-right hover:bg-gray-100 p-2 rounded transition-colors">
                   <span className="text-[10px] font-mono text-gray-400 shrink-0 w-12 pt-1 ltr text-left">
                     {Math.floor(seg.start / 60)}:{Math.floor(seg.start % 60).toString().padStart(2, '0')}
                   </span>
                   <p className="text-sm text-gray-600 leading-relaxed w-full">{seg.text}</p>
                 </div>
               ))
             ) : (
               <p className="font-mono text-xs text-gray-500 whitespace-pre-line leading-relaxed text-right">
                 {data.transcript || "No transcript available."}
               </p>
             )}
           </div>
        </motion.section>

      </main>
    </div>
  );
};

export default InsightView;