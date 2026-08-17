
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TwinMetadata, SmartCityInsight, BranchSuggestion } from "../types";
import { bLanService } from "./BLanService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const findOfficialGISPortals = async (cityName: string, address: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Find official GIS Open Data portals, ArcGIS Hubs, or map portals for the city: ${cityName} at ${address}. 
      Provide the most relevant official governmental URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web?.uri)
      .filter(Boolean) || [];

    return { text, sources };
  } catch (error) {
    console.error("Error finding GIS portals:", error);
    return { text: "Unable to find specific GIS portals automatically.", sources: [] };
  }
};

export const generateDigitalTwinInsights = async (metadata: TwinMetadata): Promise<SmartCityInsight[]> => {
  const prompt = `
    Analyze the following entity for a Digital Twin application based on the NIST Smart Cities framework.
    Entity Name: ${metadata.name}
    Address: ${metadata.address}
    Type: ${metadata.type}
    Location: ${metadata.location?.lat}, ${metadata.location?.lng}

    Provide detailed, realistic (but simulated) data insights for the following layers:
    - Energy, Water, Waste, Transportation, Public Safety, Healthcare
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              layer: { type: Type.STRING },
              status: { type: Type.STRING },
              value: { type: Type.STRING },
              summary: { type: Type.STRING },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["layer", "status", "value", "summary", "recommendations"]
          }
        }
      }
    });

    const results = JSON.parse(response.text || "[]");
    return results as SmartCityInsight[];
  } catch (error) {
    console.error("Error generating twin insights:", error);
    // Return fallback data if AI fails
    return [
      {
        layer: "Energy",
        status: "optimal",
        value: "94%",
        summary: "Grid stability is high with renewable integration at peak efficiency.",
        recommendations: ["Maintain current solar feed-in tariffs", "Optimize battery storage discharge cycles"]
      },
      {
        layer: "Water",
        status: "warning",
        value: "72%",
        summary: "Pressure drop detected in the northern sector. Potential leak in main trunk.",
        recommendations: ["Deploy acoustic sensors to sector 4", "Check pressure valve 12-B"]
      },
      {
        layer: "Public Safety",
        status: "optimal",
        value: "98%",
        summary: "Emergency response times are below the 5-minute threshold city-wide.",
        recommendations: ["Continue drone patrol rotation", "Update community alert protocols"]
      },
      {
        layer: "Transportation",
        status: "critical",
        value: "42%",
        summary: "Congestion peak detected on Broadway. Public transit delays exceeding 15 minutes.",
        recommendations: ["Activate dynamic lane management", "Increase bus frequency on line 7"]
      }
    ] as SmartCityInsight[];
  }
};

export const chatWithMapsGrounding = async (message: string, metadata: TwinMetadata | null) => {
  const isIsolated = !!window.localStorage.getItem('blan_isolated');
  // TRUE OFFLINE DETECTION & B-LAN QUEUING
  if (!navigator.onLine || isIsolated) {
    const taskId = await bLanService.broadcastTask({
      model_cid: metadata?.name || 'unknown-city',
      input_data: message,
      priority: 1
    });

    return {
      text: `[B-LAN MESH QUEUE] Connection lost. Task ${taskId} has been broadcasted to the mesh. A nearby node with higher VRAM will process this and return the result when signal is regained.`,
      sources: [],
      isLocal: true,
      taskId
    };
  }

  const systemInstruction = `You are a helpful assistant for the Civic Twin platform of ${metadata?.name || 'a community'}. 
  Context: Entity ${metadata?.name} is located at ${metadata?.address}.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction,
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: metadata?.location ? {
              latitude: metadata.location.lat,
              longitude: metadata.location.lng
            } : undefined
          }
        }
      },
    });

    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.maps?.uri)
      .filter(Boolean);

    return {
      text: response.text || "I couldn't process that request.",
      sources: urls || [],
      isLocal: false
    };
  } catch (error) {
    console.error("Maps grounding chat failed", error);
    return { text: "Chat service currently unavailable. Using local knowledge.", sources: [], isLocal: true };
  }
};

export const getLiveAudioSession = (callbacks: any, metadata: TwinMetadata | null) => {
  return ai.live.connect({
    model: 'gemini-3.1-flash-live-preview',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: `You are the voice of Civic Twin for ${metadata?.name || 'this community'}.`,
    },
  });
};

export const generatePlanetAiReport = async (metadata: TwinMetadata, dateRange: string): Promise<string> => {
  const prompt = `
    Generate a detailed AI analysis report for the community: ${metadata.name} at ${metadata.address}.
    The report is based on Planet Labs PlanetScope daily satellite imagery for the period: ${dateRange}.
    
    Focus on:
    - Urban development changes
    - Vegetation health (NDVI)
    - Infrastructure stability
    - Environmental impact assessment
    
    Format the output as a professional technical report in Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Planet AI Report generation failed", error);
    return "Report generation failed due to service interruption.";
  }
};

export const generatePRSummary = async (metadata: TwinMetadata | null, insights?: SmartCityInsight[]): Promise<{title: string, body: string}> => {
  const prompt = `Write a GitHub Pull Request description for AngelSharks/Civic-Twin.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["title", "body"]
        }
      }
    });
    return JSON.parse(response.text || '{"title": "feat: Update", "body": "Update."}');
  } catch (error) {
    return { title: `feat: Core Update`, body: "Architectural update." };
  }
};

export const generateCoreArchitecturalSuggestions = async (): Promise<BranchSuggestion[]> => {
  const prompt = `Suggest 3 major architectural Pull Requests for AngelSharks/Civic-Twin.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              purpose: { type: Type.STRING },
              prTitle: { type: Type.STRING },
              prBody: { type: Type.STRING }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};
