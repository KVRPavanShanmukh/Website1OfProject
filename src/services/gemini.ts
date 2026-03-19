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
    contents: `Find high-quality coding challenges, practice problems, and interview questions for the topic: "${topic}".
    Search across all major platforms like LeetCode, Codeforces, CodeChef, HackerRank, GeeksforGeeks, InterviewBit, TopCoder, etc.
    
    Organize them into:
    1. "Best Resource": The single most recommended resource or problem set for this topic.
    2. "Top 10 Interview Problems": The most essential questions.
    3. "Top 50 Problems Asked": A comprehensive list of frequently asked problems.
    4. "Related Problems": Other relevant problems to reach a total of at most 75 problems.
    
    Provide direct URLs and ensure they are high quality.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bestResource: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
              platform: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Why this is the best resource" }
            },
            required: ["title", "url", "platform", "reason"]
          },
          top10Interview: {
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
          },
          top50Asked: {
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
          },
          relatedProblems: {
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
        required: ["bestResource", "top10Interview", "top50Asked", "relatedProblems"]
      }
    },
  });

  try {
    const data = JSON.parse(response.text || "{}");
    const best = data.bestResource ? [{ ...data.bestResource, category: 'best' }] : [];
    const interview = (data.top10Interview || []).map((p: any) => ({ ...p, category: 'interview' }));
    const top50 = (data.top50Asked || []).map((p: any) => ({ ...p, category: 'top50' }));
    const related = (data.relatedProblems || []).map((p: any) => ({ ...p, category: 'related' }));
    
    // Combine and limit to 75
    const all = [...best, ...interview, ...top50, ...related];
    return all.slice(0, 75);
  } catch (e) {
    console.error("Failed to parse challenges:", e);
    return [];
  }
}

export async function searchCSConcept(concept: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Find ALL possible high-quality resources for the computer science concept: "${concept}". 
    Search across all websites globally (YouTube, Medium, Dev.to, Official Docs, Coursera, edX, etc.).
    
    CRITICAL: Identify the single BEST resource first and explain why. 
    Then provide a comprehensive list of all other valuable resources.
    
    Include titles, descriptions, and direct URLs.`,
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

export async function chatWithAI(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are a helpful AI assistant for a computer science learning platform called Shanmukh AI VidyaPeettham. Help users with their coding questions, roadmap planning, and technical concepts.",
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
