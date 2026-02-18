
import { UserInputData, GeneratedPortfolio } from "../types";

// Standard declarations for globally loaded scripts
declare const puter: any;
declare const pdfjsLib: any;
declare global {
  interface Window {
    GoogleGenAI: any;
  }
}

// Model defined by task type: Basic Text Task
const GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Robustly initialize GoogleGenAI.
 * Strictly uses process.env.API_KEY as requested.
 */
function getAIInstance() {
  const GenAI = window.GoogleGenAI;
  // @ts-ignore
  const apiKey = process.env.API_KEY;

  if (!GenAI) {
    console.error("GoogleGenAI SDK not found on window object.");
    return null;
  }

  if (!apiKey) {
    console.error("API Key is missing from process.env.API_KEY.");
    return null;
  }

  return new GenAI({ apiKey });
}

/**
 * Centralized content generation with fallback.
 */
async function generateWithAI(prompt: string, isJson: boolean = true): Promise<string> {
  const ai = getAIInstance();

  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ parts: [{ text: prompt }] }],
        config: isJson ? { responseMimeType: "application/json" } : undefined
      });
      return response.text || "";
    } catch (err) {
      console.warn("Gemini API error, falling back to Puter:", err);
    }
  }

  // Fallback to Puter.js if Gemini is unavailable
  try {
    const res = await puter.ai.chat(prompt);
    return res?.message?.content || res?.toString() || "";
  } catch (err) {
    console.error("All AI services failed:", err);
    throw new Error("Could not connect to AI services.");
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  } catch (e) {
    throw new Error("PDF parsing failed.");
  }
}

export async function parseResumeFromText(text: string): Promise<Partial<UserInputData>> {
  const prompt = `Extract portfolio data from this resume text: "${text.substring(0, 8000)}". Output valid JSON: { "fullName": "", "role": "", "bio": "", "skills": "", "projects": [], "education": [] }`;
  const result = await generateWithAI(prompt, true);
  return JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
}

export async function generatePortfolioData(userData: UserInputData): Promise<GeneratedPortfolio> {
  const prompt = `Create a stunning portfolio structure for ${userData.fullName} (${userData.role}). 
    Experience: ${userData.experience}. 
    Theme vibe: ${userData.themePreference}. 
    Return JSON matching the GeneratedPortfolio interface with hero, about, skills, theme, and sections.`;
  
  const result = await generateWithAI(prompt, true);
  const data = JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
  
  // Ensure images are preserved
  if (data.sections) {
    data.sections.forEach((section: any, idx: number) => {
      if (section.type === 'grid' && userData.projects[idx]?.imageUrls) {
        section.items[0].imageUrls = userData.projects[idx].imageUrls;
      }
    });
  }
  return data;
}

export async function modifyPortfolio(current: GeneratedPortfolio, instruction: string): Promise<GeneratedPortfolio> {
  const prompt = `Current Portfolio JSON: ${JSON.stringify(current)}. Instruction: "${instruction}". Modify the JSON and return it.`;
  const result = await generateWithAI(prompt, true);
  return JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
}
