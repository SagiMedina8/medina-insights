import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload } from "lucide-react";
import { PersonaType, Recording } from "@/types/recording";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recording: Recording) => void;
}

const personas: PersonaType[] = ["Manager", "Employee", "Designer", "Owner"];

const UploadModal = ({ isOpen, onClose, onSubmit }: UploadModalProps) => {
  const [name, setName] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>("Manager");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    const recording: Recording = {
      id: Date.now().toString(),
      name,
      persona: selectedPersona,
      status: "PROCESSING",
      created_at: new Date().toISOString(),
    };

    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      const stored = localStorage.getItem("medina_recordings");
      const recordings = stored ? JSON.parse(stored) : [];
      const updated = recordings.map((r: Recording) =>
        r.id === recording.id ? { ...r, status: "DONE" as const } : r
      );
      localStorage.setItem("medina_recordings", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    }, 3000);

    onSubmit(recording);
    
    // Reset form
    setName("");
    setFile(null);
    setSelectedPersona("Manager");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.4 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background z-50 overflow-y-auto"
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-12">
                <div>
                  <h2 className="text-3xl font-bold mb-2">NEW ANALYSIS</h2>
                  <p className="text-sm text-muted-foreground">
                    Upload audio and select target persona
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-muted transition-all duration-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Recording Name */}
                <div>
                  <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                    Recording Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="brutalist-input"
                    placeholder="e.g., Team Meeting Q4 Review"
                    required
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                    Audio File
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`brutalist-border p-12 text-center transition-all duration-300 ${
                      isDragging ? "bg-muted border-primary" : "bg-background"
                    }`}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    {file ? (
                      <div>
                        <p className="font-medium mb-2">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="text-sm underline"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2">Drop audio file here</p>
                        <p className="text-sm text-muted-foreground mb-4">or</p>
                        <label className="inline-block px-6 py-2 brutalist-border bg-muted hover:bg-foreground hover:text-background transition-all duration-300 cursor-pointer font-bold text-sm uppercase tracking-wide">
                          Browse Files
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) =>
                              setFile(e.target.files?.[0] || null)
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Persona Selection */}
                <div>
                  <label className="block text-sm font-bold mb-3 uppercase tracking-wide">
                    Target Persona
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {personas.map((persona) => (
                      <motion.button
                        key={persona}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPersona(persona)}
                        className={`p-6 brutalist-border font-bold uppercase tracking-wide transition-all duration-300 ${
                          selectedPersona === persona
                            ? "bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted"
                        }`}
                      >
                        {persona}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!name || !file}
                  className="w-full brutalist-button disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  START PROCESSING
                </motion.button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
