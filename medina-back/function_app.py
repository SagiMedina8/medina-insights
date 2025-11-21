import azure.functions as func
import logging
import os
import json
import tempfile
import pathlib
from openai import OpenAI
import db_service 

# אתחול האפליקציה
app = func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)

# הגדרת הלקוח של OpenAI
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# --- 1. העלאת קובץ וניתוח ---
@app.route(route="upload_audio", methods=["POST"])
def upload_audio(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Processing audio upload request.')

    try:
        if not req.files or 'file' not in req.files:
             return func.HttpResponse("No file uploaded", status_code=400)

        file = req.files['file']
        user_oid = req.form.get('user_oid', 'unknown_user')
        # קליטת הפרסונה
        selected_persona = req.form.get('persona', 'FOUNDER')
        
        filename = file.filename
        logging.info(f"Received file: {filename} from user: {user_oid}")

        # שמירה זמנית (תיקון לוואטסאפ)
        file_extension = pathlib.Path(filename).suffix.lower()
        if file_extension == ".opus":
            file_extension = ".ogg"
        elif not file_extension:
            file_extension = ".mp3"

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_audio:
            temp_audio.write(file.stream.read())
            temp_audio_path = temp_audio.name

        # תמלול
        logging.info("Starting Transcription...")
        with open(temp_audio_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1", 
                file=audio_file,
                language="he",
                response_format="verbose_json" 
            )
        
        full_text = transcription.text
        segments = transcription.segments
        
        clean_segments = []
        for seg in segments:
            clean_segments.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text,
                "speaker": "Speaker"
            })

        # ניתוח AI
        logging.info("Generating Insights with GPT-4o...")
        system_prompt = f"""
        You are an AI assistant for a Bridal Salon Manager.
        Current Persona: {selected_persona}
        Analyze the attached conversation transcript based on this persona's interests.
        You must answer in HEBREW (עברית).
        Return ONLY a JSON object with this exact structure:
        {{
            "title": "Short title for the insight",
            "main_summary": "A concise summary of the conversation (2-3 sentences)",
            "category": "SALES" or "OPERATIONS" or "CUSTOMER_SATISFACTION",
            "priority": 1 (High) or 2 (Medium) or 3 (Low),
            "action_items": ["Item 1", "Item 2"],
            "sentiment": "Positive/Neutral/Negative"
        }}
        """

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Transcript:\n{full_text}"}
            ],
            response_format={ "type": "json_object" }
        )

        result_content = response.choices[0].message.content
        insights_json = json.loads(result_content)
        
        input_tokens = response.usage.prompt_tokens
        output_tokens = response.usage.completion_tokens

        # שמירה ל-DB
        logging.info("Saving to DB...")
        analysis_id = db_service.save_analysis_flow(
            user_oid=user_oid,
            file_name=filename,
            duration=0, 
            persona_code=selected_persona, 
            transcript_text=full_text,
            transcript_segments=clean_segments,
            insight_json=insights_json,
            input_tokens=input_tokens,
            output_tokens=output_tokens
        )

        os.remove(temp_audio_path)
        logging.info("Process Complete Successfully!")
        
        return func.HttpResponse(
            json.dumps({"analysis_id": analysis_id, "status": "success"}, default=str), 
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Error processing request: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=500)


# --- 2. שליפת רשימה (התיקון החשוב כאן!) ---
@app.route(route="get_recordings", methods=["GET"])
def get_recordings(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Fetching user recordings.')
    try:
        user_oid = req.params.get('user_oid', 'test-employee-001')
        recordings = db_service.get_user_analyses(user_oid)
        
        # התיקון: default=str מטפל ב-UUID ובתאריכים אוטומטית
        return func.HttpResponse(
            json.dumps(recordings, default=str), 
            mimetype="application/json", 
            status_code=200
        )
    except Exception as e:
        logging.error(f"Error fetching recordings: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=500)


# --- 3. שליפת אנליזה מלאה ---
@app.route(route="get_analysis/{id}", methods=["GET"])
def get_analysis(req: func.HttpRequest) -> func.HttpResponse:
    analysis_id = req.route_params.get('id')
    logging.info(f'Fetching details for analysis: {analysis_id}')
    try:
        data = db_service.get_analysis_full_details(analysis_id)
        if not data:
            return func.HttpResponse("Analysis not found", status_code=404)
            
        # התיקון: default=str
        return func.HttpResponse(
            json.dumps(data, default=str), 
            mimetype="application/json", 
            status_code=200
        )
    except Exception as e:
        logging.error(f"Error fetching analysis: {e}")
        return func.HttpResponse(json.dumps({"error": str(e)}), status_code=500)


# --- 4. מחיקה ---
@app.route(route="delete_analysis/{id}", methods=["DELETE"])
def delete_analysis(req: func.HttpRequest) -> func.HttpResponse:
    analysis_id = req.route_params.get('id')
    logging.info(f'Request to delete analysis: {analysis_id}')

    if db_service.delete_analysis_from_db(analysis_id):
        return func.HttpResponse(json.dumps({"status": "deleted"}), status_code=200)
    else:
        return func.HttpResponse("Failed to delete", status_code=500)