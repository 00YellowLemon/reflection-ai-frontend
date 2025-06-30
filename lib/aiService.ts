import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { db } from "../firebaseConfig";

interface AiServiceResponse {
  ai_response: string;
  // Other fields might exist in the actual response, but we only need ai_response
}

export const fetchAiResponse = async (docId: string, query: string): Promise<string> => {
  // Get the Firebase Functions instance
  const functions = getFunctions();
  // Reference the callable function deployed in Firebase (adjust name as needed)
  const getAiResponse = httpsCallable(functions, "getAiResponse");

  try {
    const result: any = await getAiResponse({
      input_text: query,
      thread_id: docId,
    });
    // The result.data should contain the ai_response
    if (!result?.data?.ai_response || typeof result.data.ai_response !== "string") {
      throw new Error("AI response not found or not in the expected format.");
    }
    return result.data.ai_response;
  } catch (error) {
    console.error("Failed to fetch AI response from Firebase:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred while fetching the AI response from Firebase.");
  }
};
