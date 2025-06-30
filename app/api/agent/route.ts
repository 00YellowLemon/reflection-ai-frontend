
import { NextRequest, NextResponse } from "next/server";
import { getReflectionAgent } from "../../../lib/reflectionAgent";
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

export async function POST(req: NextRequest) {
  const { message, threadId } = await req.json();

  if (!message || !threadId) {
    return NextResponse.json(
      { error: "Message and threadId are required" },
      { status: 400 }
    );
  }

  try {
    const agent = await getReflectionAgent();

    // Add the user's message to the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
    });

    // Run the agent to get a response
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: agent.id,
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
    }

    // Get the latest message from the agent
    const messages = await openai.beta.threads.messages.list(threadId);
    const agentResponse = messages.data[0];

    return NextResponse.json({ response: agentResponse });
  } catch (error) {
    console.error("Error interacting with agent:", error);
    return NextResponse.json(
      { error: "Failed to get response from agent" },
      { status: 500 }
    );
  }
}
