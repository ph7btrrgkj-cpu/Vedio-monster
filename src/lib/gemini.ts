import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeVideoScenes(videoUrl: string): Promise<any[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        text: `Analyze this video clip and identify all major scene changes and key transition points. 
        Provide the result as a JSON array of objects, where each object has:
        - "startTime": number (seconds)
        - "endTime": number (seconds)
        - "description": string (short description in Arabic of what happens in the scene)
        
        The video is at this URL: ${videoUrl}
        
        Return ONLY the JSON array.`
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            startTime: { type: Type.NUMBER },
            endTime: { type: Type.NUMBER },
            description: { type: Type.STRING },
          },
          required: ["startTime", "endTime", "description"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse scene analysis:", e);
    return [];
  }
}

export async function generateMotionFromPrompt(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: `You are an expert motion graphics designer. 
      Analyze the user's Arabic prompt and return a structured animation plan in JSON format.
      The plan should include effects like rotation, zoom, slide, fade, glow, and particles.
      Return exactly a JSON object matching this schema:
      {
        "effects": [{
          "type": "string", // rotation, zoom, slide, shake, fade, glow, particles
          "duration": "number", // seconds
          "delay": "number", // seconds
          "easing": "string" // ease-in, ease-out, ease-in-out, linear
        }],
        "suggestedBackground": "string",
        "suggestedMusic": "string"
      }`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          effects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                duration: { type: Type.NUMBER },
                delay: { type: Type.NUMBER },
                easing: { type: Type.STRING }
              },
              required: ["type", "duration", "delay", "easing"]
            }
          },
          suggestedBackground: { type: Type.STRING },
          suggestedMusic: { type: Type.STRING }
        },
        required: ["effects", "suggestedBackground", "suggestedMusic"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function suggestTemplate(imageDescription: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest the best video template for: ${imageDescription}`,
    config: {
      systemInstruction: "You are a creative assistant. Based on the logo or image description, suggest one of our templates: political, news, luxury, social. Return the template id only.",
      responseMimeType: "text/plain"
    }
  });

  return response.text?.trim() || 'social';
}
