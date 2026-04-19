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

export async function searchTutorials(query: string, category: string = 'All') {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Search for high-quality YouTube tutorials for the topic: "${query}" in the category: "${category}".
    
    CRITICAL: Fetch only REAL YouTube video results. 
    Prioritize:
    - Most viewed videos
    - High engagement
    - Trusted channels (e.g., FreeCodeCamp, Traversy Media, Fireship, etc.)
    - Beginner-friendly tutorials
    - Long-form complete tutorials
    
    Return a list of videos with their metadata.`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "YouTube Video ID (standard 11 characters, or a realistic slug)" },
            title: { type: Type.STRING },
            channelName: { type: Type.STRING },
            views: { type: Type.STRING },
            uploadDate: { type: Type.STRING },
            duration: { type: Type.STRING },
            thumbnail: { type: Type.STRING, description: "Realistic YouTube Thumbnail URL (high quality)" },
            category: { type: Type.STRING },
            aiScore: { type: Type.NUMBER, description: "Estimated quality score from 1-100" }
          },
          required: ["id", "title", "channelName", "views", "uploadDate", "duration", "thumbnail", "category", "aiScore"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse tutorials:", e);
    // Return mock data if service fails
    return [
      {
        id: "vLnPwxZdW4Y",
        title: "C++ Programming Full Course for Beginners",
        channelName: "FreeCodeCamp",
        views: "12M views",
        uploadDate: "3 years ago",
        duration: "31:05:22",
        thumbnail: "https://picsum.photos/seed/tutorial1/1920/1080",
        category: "Programming",
        aiScore: 98
      },
      {
        id: "rfscVS0vtbw",
        title: "Learn Python - Full Course for Beginners [Tutorial]",
        channelName: "FreeCodeCamp",
        views: "45M views",
        uploadDate: "5 years ago",
        duration: "4:26:52",
        thumbnail: "https://picsum.photos/seed/tutorial2/1920/1080",
        category: "Programming",
        aiScore: 95
      }
    ];
  }
}
