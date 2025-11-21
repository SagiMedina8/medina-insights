export type PersonaType = 'FOUNDER' | 'DESIGNER' | 'FITTER' | 'SALES';

export interface Recording {
  id: string;
  name: string;     // מגיע מהשרת כ- original_filename
  created_at: string;
  status: string;   // שינינו ל-string כדי למנוע קריסות על אותיות קטנות/גדולות
  persona: PersonaType;
  summary_snippet?: string; // הוספנו את זה (אופציונלי)
}

export interface Insight {
  recording_id: string;
  persona: PersonaType;
  summary: string;
  action_items: string[];
  critical_points?: string[];
  transcript: string;
  category?: string;
  sentiment?: string;
  priority?: number;
}