import os
import json
import psycopg2
from datetime import datetime

# פונקציה לחיבור לדאטה-בייס
def get_db_connection():
    try:
        conn_string = os.environ["DB_CONNECTION_STRING"]
        conn = psycopg2.connect(conn_string)
        return conn
    except Exception as e:
        print(f"Error connecting to DB: {e}")
        raise e

# --- פונקציה 1: שמירה (Save) ---
def save_analysis_flow(user_oid, file_name, duration, persona_code, transcript_text, transcript_segments, insight_json, input_tokens, output_tokens):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. Users
        user_sql = "INSERT INTO users (id, email, full_name, last_login_at) VALUES (%s, %s, %s, NOW()) ON CONFLICT (id) DO UPDATE SET last_login_at = NOW()"
        cur.execute(user_sql, (user_oid, f"{user_oid}@medina.app", "Demo User"))

        # 2. Audio Files
        file_sql = "INSERT INTO audio_files (user_id, original_filename, blob_path, duration_seconds, mime_type) VALUES (%s, %s, %s, %s, 'audio/mpeg') RETURNING id"
        fake_blob_path = f"uploads/{user_oid}/{file_name}"
        cur.execute(file_sql, (user_oid, file_name, fake_blob_path, duration))
        audio_id = cur.fetchone()[0]

        # 3. Analyses
        analysis_sql = "INSERT INTO analyses (user_id, audio_file_id, persona_type_code, persona_name_snapshot, status, summary_snippet, input_tokens, output_tokens, started_at, completed_at) VALUES (%s, %s, %s, %s, 'DONE', %s, %s, %s, NOW(), NOW()) RETURNING id"
        summary = insight_json.get('main_summary', 'No summary generated')
        cur.execute(analysis_sql, (user_oid, audio_id, persona_code, persona_code, summary, input_tokens, output_tokens))
        analysis_id = cur.fetchone()[0]

        # 4. Transcripts
        transcript_sql = "INSERT INTO transcripts (analysis_id, full_text, segments, language_code, words_count) VALUES (%s, %s, %s, 'he', %s)"
        segments_json = json.dumps(transcript_segments)
        word_count = len(transcript_text.split())
        cur.execute(transcript_sql, (analysis_id, transcript_text, segments_json, word_count))

        # 5. Insights
        insight_sql = "INSERT INTO persona_insights (analysis_id, persona_type_code, title, main_summary, insight_category, priority_level, raw_insight_json) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        cur.execute(insight_sql, (
            analysis_id,
            persona_code,
            insight_json.get('title', 'General Analysis'),
            insight_json.get('main_summary', ''),
            insight_json.get('category', 'GENERAL'),
            insight_json.get('priority', 2),
            json.dumps(insight_json)
        ))

        conn.commit()
        print(f"Successfully saved Analysis ID: {analysis_id}")
        return str(analysis_id)

    except Exception as e:
        conn.rollback()
        print(f"DB Transaction failed: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

# --- פונקציה 2: שליפת רשימה (התיקון הגדול כאן!) ---
def get_user_analyses(user_oid):
    conn = get_db_connection()
    cur = conn.cursor() # בלי RealDictCursor - שיטה ידנית ובטוחה
    
    try:
        # שולפים רק את העמודות שאנחנו צריכים, בסדר ידוע מראש
        sql = """
            SELECT 
                a.id, 
                a.created_at, 
                a.status, 
                a.persona_type_code, 
                f.original_filename, 
                a.summary_snippet
            FROM analyses a
            JOIN audio_files f ON a.audio_file_id = f.id
            WHERE a.user_id = %s
            ORDER BY a.created_at DESC
        """
        cur.execute(sql, (user_oid,))
        rows = cur.fetchall()
        
        clean_results = []
        for row in rows:
            # המרה ידנית לטקסט - מונע כל קריסה אפשרית
            clean_results.append({
                "id": str(row[0]),
                "created_at": str(row[1]) if row[1] else "",
                "status": str(row[2]),
                "persona": str(row[3]),
                "name": str(row[4]),
                "summary_snippet": str(row[5]) if row[5] else ""
            })
            
        return clean_results

    except Exception as e:
        print(f"Error fetching analyses: {e}")
        return []
    finally:
        cur.close()
        conn.close()

# --- פונקציה 3: שליפת פרטים מלאים (גם כאן המרה ידנית) ---
def get_analysis_full_details(analysis_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        # 1. פרטים ראשיים
        sql_main = """
            SELECT 
                a.id, a.status, a.created_at,
                a.persona_type_code,
                f.original_filename,
                pi.main_summary,
                pi.insight_category,
                pi.raw_insight_json
            FROM analyses a
            JOIN audio_files f ON a.audio_file_id = f.id
            LEFT JOIN persona_insights pi ON a.id = pi.analysis_id
            WHERE a.id = %s
        """
        cur.execute(sql_main, (analysis_id,))
        row = cur.fetchone()
        
        if not row:
            return None

        # בניית האובייקט ידנית
        analysis_data = {
            "id": str(row[0]),
            "status": str(row[1]),
            "created_at": str(row[2]),
            "persona": str(row[3]),
            "name": str(row[4]),
            "main_summary": str(row[5]) if row[5] else "",
            "insight_category": str(row[6]) if row[6] else "",
            "raw_insight_json": row[7] if row[7] else {} # זה כבר מגיע כדיקט, אז זה בסדר
        }

        # 2. תמלול
        cur.execute("SELECT full_text, segments FROM transcripts WHERE analysis_id = %s", (analysis_id,))
        transcript_row = cur.fetchone()
        
        if transcript_row:
            analysis_data['transcript'] = str(transcript_row[0])
            analysis_data['segments'] = transcript_row[1] # גם זה מגיע כדיקט/ליסט
            
        return analysis_data

    except Exception as e:
        print(f"Error fetching full details: {e}")
        return None
    finally:
        cur.close()
        conn.close()

# --- פונקציה 4: מחיקה ---
def delete_analysis_from_db(analysis_id):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("DELETE FROM persona_insights WHERE analysis_id = %s", (analysis_id,))
        cur.execute("DELETE FROM transcripts WHERE analysis_id = %s", (analysis_id,))
        cur.execute("DELETE FROM analyses WHERE id = %s", (analysis_id,))
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"Error deleting analysis: {e}")
        return False
    finally:
        conn.close()