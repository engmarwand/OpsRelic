import { GoogleGenAI } from "@google/genai";
import { AI_ACTIONS } from "../lib/aiConfig";

// Lazy init as per guidelines
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const MODEL_NAME = "gemini-3-flash-preview";

export async function runAIAction(actionId: string, context: any) {
  const action = AI_ACTIONS[actionId];
  if (!action) throw new Error("Invalid AI Action");

  const ai = getAI();

  let prompt = "";
  if (actionId === 'CREATE_DRAFT') {
    prompt = `You are an expert campaign strategist. Based on this intake data: ${JSON.stringify(context.intake)}, 
    generate a comprehensive campaign brief in JSON format. 
    Required keys: summary, objective, angle, nextSteps, platforms (array).
    Return ONLY raw JSON.`;
  } else if (actionId === 'REWRITE_BRIEF') {
    prompt = `Rewrite and professionalize this campaign brief section to be more compelling and strategic: "${context.text}". 
    The tone should be "${context.tone || 'professional and high-growth'}".
    Return ONLY the rewritten text.`;
  } else if (actionId === 'CLIENT_UPDATE') {
    prompt = `Generate a professional client-ready status update based on this performance data: ${JSON.stringify(context.data)}. 
    Highlight key wins and next steps. Return ONLY the update text.`;
  } else if (actionId === 'PERFORMANCE_SUMMARY') {
    prompt = `Analyze this performance data and provide a deep strategic summary for an internal agency team: ${JSON.stringify(context.data)}. 
    Focus on trends, ROI, and creative suggestions. Return ONLY the summary text.`;
  } else {
    prompt = `You are an AI Copilot for a content agency platform called OpsRelic. 
    User message: "${context.message}". 
    Application context: ${JSON.stringify(context.appContext)}.
    Help the user with their request. If it matches a tool you know, suggest it.`;
  }

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt
  });

  return response.text || "";
}

export async function chatWithCopilot(message: string, history: any[], appContext: any) {
  const ai = getAI();
  
  const systemPrompt = `You are the OpsRelic AI Copilot. You help agency owners manage their pipeline, campaigns, and reporting.
  Current Context: ${JSON.stringify(appContext)}.
  Available Actions: ${JSON.stringify(Object.values(AI_ACTIONS))}.
  Be action-oriented. Suggest specific AI tools if they fit the user's request.
  Keep responses concise and professional.`;

  // Filter history to conform to GenAI expectations if needed, 
  // but for simple chat we can just pass the new message with context.
  const fullPrompt = `${systemPrompt}\n\nRecent History: ${JSON.stringify(history.slice(-4))}\n\nUser: ${message}`;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: fullPrompt
  });

  return response.text || "";
}
