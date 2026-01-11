
import { GoogleGenAI, Type, Chat, GenerateContentResponse } from "@google/genai";
import { MediaMetadata } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async analyzeUrl(url: string): Promise<{ metadata: MediaMetadata; sources: any[] }> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Perform an deep analysis of this media URL for a professional downloader app.
      URL: ${url}
      
      Task:
      1. Verify the media details (Title, Creator, Date, Platform).
      2. Provide a 3-sentence summary of the content.
      3. Generate download options for AUDIO (MP3), 720p, 1080p, and 4K (UHD).
      4. Suggest 3-5 high-relevance tags.
      
      Output MUST be valid JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            platform: { type: Type.STRING },
            author: { type: Type.STRING },
            duration: { type: Type.STRING },
            thumbnail: { type: Type.STRING },
            summary: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  quality: { type: Type.STRING },
                  label: { type: Type.STRING },
                  size: { type: Type.STRING },
                  format: { type: Type.STRING },
                  downloadUrl: { type: Type.STRING }
                },
                required: ["quality", "label", "size", "format", "downloadUrl"]
              }
            }
          },
          required: ["title", "platform", "author", "duration", "thumbnail", "summary", "tags", "options"]
        }
      }
    });

    try {
      const metadata = JSON.parse(response.text.trim()) as MediaMetadata;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      return { metadata, sources };
    } catch (error) {
      console.error("Failed to parse Gemini response", error);
      throw new Error("The AI could not securely verify this link. Please try another.");
    }
  }

  createChatSession(metadata: MediaMetadata): Chat {
    return this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are the AI Media Downloader assistant. 
        You are helping the user with a media file titled "${metadata.title}" by "${metadata.author}".
        Summarized as: ${metadata.summary}.
        Be professional, concise, and technical if asked about codecs or quality. 
        Don't encourage piracy, but help the user understand the content they are about to download.`
      }
    });
  }
}

export const geminiService = new GeminiService();
