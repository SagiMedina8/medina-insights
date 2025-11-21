// src/services/api.ts

// הכתובת של השרת המקומי (נשנה את זה כשנעלה לענן)
const API_URL = "/api";

export const uploadFileToBackend = async (
  file: File, 
  userOid: string, 
  context?: string,
  persona: string = "FOUNDER" // <-- פרמטר חדש
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_oid', userOid);
  formData.append('persona', persona); // <-- שולחים לשרת
  if (context) formData.append('context', context);

  try {
    const response = await fetch(`${API_URL}/upload_audio`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();

  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
export const getRecordings = async (userOid: string) => {
  try {
    const response = await fetch(`${API_URL}/get_recordings?user_oid=${userOid}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch recordings");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching recordings:", error);
    return []; // מחזירים רשימה ריקה במקרה של שגיאה
  }
};

export const getAnalysisDetails = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/get_analysis/${id}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch analysis details");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return null;
  }
};

export const deleteRecording = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/delete_analysis/${id}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error("Error deleting:", error);
    return false;
  }
};