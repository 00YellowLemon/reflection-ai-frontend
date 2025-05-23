
interface AiServiceResponse {
  ai_response: string;
  // Other fields might exist in the actual response, but we only need ai_response
}

export const fetchAiResponse = async (docId: string, query: string): Promise<string> => {
  const requestBody = {
    input_text: query,
    thread_id: docId,
  };

  try {
    const response = await fetch('https://reflection-backend-1p0x.onrender.com/post', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Backend did not return JSON, or other parsing error
        console.error("Failed to parse error response from backend:", e);
      }
      console.error("Backend error:", errorData);
      throw new Error(
        `HTTP error! status: ${response.status}${errorData?.detail ? ` - ${errorData.detail}` : ''}`
      );
    }

    const responseData: AiServiceResponse = await response.json();

    if (typeof responseData.ai_response !== 'string') {
      console.error("AI response not found or not a string in backend response:", responseData);
      throw new Error("AI response not found or not in the expected format.");
    }

    return responseData.ai_response;

  } catch (error) {
    console.error("Failed to fetch AI response:", error);
    // Re-throw the error so the caller can handle it appropriately
    if (error instanceof Error) {
      throw error;
    }
    // Fallback for non-Error objects thrown
    throw new Error('An unknown error occurred while fetching the AI response.');
  }
};
