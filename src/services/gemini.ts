import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getGeneralizedTopicName(query: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Given the search query: "${query}", provide a short, common, and generalized name for this computer science topic (e.g., if the query is "how to use linked lists in python", the generalized name is "Linked List"). Return only the name.`,
  });
  return response.text?.trim() || query;
}

export async function fetchChallengesForTopic(topic: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the Top 10 most frequently asked interview questions/coding challenges for the topic: "${topic}".
    Focus on problems that are commonly asked in technical interviews at top companies.
    Include problems from platforms like LeetCode, CodeChef, HackerRank, GeeksforGeeks, etc.
    Provide direct URLs to the challenges and ensure they are freely accessible.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            platform: { type: Type.STRING }
          },
          required: ["title", "url", "platform"]
        }
      }
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse challenges:", e);
    return [];
  }
}

export async function searchCSConcept(concept: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find the most efficient and best global resources (YouTube channels, articles, documentation, interactive courses) for the computer science concept: "${concept}". 
    Ignore the user's location and focus on the highest quality content worldwide (e.g., if a Canadian YouTuber has the best explanation, include it even for an Indian user).
    Provide a structured list with titles, descriptions, and URLs.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => chunk.web).filter(Boolean) || []
  };
}

export async function getSimulatedStudentResponse(lectureContent: string, instruction: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a student in a virtual classroom. The teacher (user) just said: "${lectureContent}".
    Your personality/instruction: "${instruction}".
    Respond as a student would in a Google Meet chat. Be realistic, ask questions if confused, or give feedback.`,
  });
  return response.text;
}
