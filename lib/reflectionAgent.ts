
import { Assistant } from "@openai/agents";
import { OpenAI } from "openai";

let openai: OpenAI;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI();
} else {
  // Mock OpenAI for local development if no API key is present
  openai = new OpenAI({
    apiKey: "mock-api-key",
    baseURL: "http://localhost:3000/mock-openai", // Point to a mock server if needed
  });
}
const agent: Assistant | undefined = undefined;

export const getReflectionAgent = async (): Promise<Assistant> => {
  if (agent) {
    return agent;
  }

  // Create a new agent if one doesn't exist
  const newAgent = await openai.beta.assistants.create({
    name: "Reflection Agent",
    instructions: `
      You are a reflection agent. Your purpose is to help users reflect on their day.
      You should guide the user through a reflection process with three main questions:
      1. How was your day?
      2. What went well today?
      3. What are you grateful for?

      Start with the first question and wait for the user's response. 
      Then, move to the next question. 
      Keep your responses supportive and encouraging.
    `,
    model: "gpt-4-1106-preview", // Replace with a Gemini model if available through the SDK
    tools: [], // No tools needed for this agent
  });

  return newAgent;
};
