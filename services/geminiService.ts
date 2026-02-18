
import { UserInputData, GeneratedPortfolio } from "../types";

declare const puter: any;
declare const pdfjsLib: any;
declare global {
  interface Window {
    GoogleGenAI: any;
  }
}

const GEMINI_MODEL = 'gemini-3-flash-preview';

/**
 * Robustly fetch the AI instance.
 * Follows strict instruction: API key must come from process.env.API_KEY.
 */
function getAIInstance() {
  const GenAI = window.GoogleGenAI;
  // @ts-ignore
  const apiKey = process.env.API_KEY;

  if (!GenAI) return null;
  if (!apiKey) {
    console.warn("Gemini API Key (process.env.API_KEY) not found. Fallback active.");
    return null;
  }

  return new GenAI({ apiKey });
}

/**
 * Sanitizes the portfolio data to prevent React rendering errors (like Error #31).
 * Specifically ensures 'skills' and 'tags' are always arrays of strings.
 */
function sanitizePortfolioData(data: any): GeneratedPortfolio {
  const clean: GeneratedPortfolio = {
    hero: data.hero || { greeting: "Hello", headline: "Welcome", subheadline: "" },
    about: data.about || { content: "" },
    skills: Array.isArray(data.skills) 
      ? data.skills.map((s: any) => {
          if (typeof s === 'string') return s;
          if (typeof s === 'object' && s !== null) {
            // Flatten objects like { category: "Frontend", items: ["React"] }
            return s.items ? s.items.join(', ') : (s.name || s.title || JSON.stringify(s));
          }
          return String(s);
        })
      : [],
    theme: data.theme || {
      primaryColor: '#3b82f6',
      backgroundColor: '#050b14',
      textColor: '#f8fafc',
      cardColor: '#1e293b',
      accentColor: '#8b5cf6',
      fontStyle: 'sans'
    },
    sections: Array.isArray(data.sections) ? data.sections.map((section: any) => ({
      ...section,
      id: section.id || Math.random().toString(36).substr(2, 9),
      items: Array.isArray(section.items) ? section.items.map((item: any) => ({
        ...item,
        tags: Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'string' ? t : String(t)) : []
      })) : []
    })) : []
  };
  return clean;
}

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
      console.warn("Gemini Error, trying Puter fallback...");
    }
  }

  try {
    const res = await puter.ai.chat(prompt);
    return res?.message?.content || res?.toString() || "";
  } catch (err) {
    throw new Error("AI Generation failed.");
  }
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item: any) => item.str).join(' ') + '\n';
  }
  return text;
}

export async function parseResumeFromText(text: string): Promise<Partial<UserInputData>> {
  const prompt = `Strictly extract data from this resume text as JSON: "${text.substring(0, 8000)}". 
  Format: { "fullName": "", "role": "", "bio": "", "skills": "comma-separated", "projects": [], "education": [] }`;
  const result = await generateWithAI(prompt, true);
  return JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
}

export async function generatePortfolioData(userData: UserInputData): Promise<GeneratedPortfolio> {
  const prompt = `Build a high-end portfolio JSON for ${userData.fullName} (${userData.role}).
  Bio: ${userData.bio}. Vibe: ${userData.themePreference}.
  IMPORTANT: 'skills' MUST be an array of STRINGS only. Do NOT use objects in the skills array.
  Follow the GeneratedPortfolio interface structure.`;
  
  const result = await generateWithAI(prompt, true);
  const rawData = JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
  const cleanData = sanitizePortfolioData(rawData);
  
  // Re-link images
  cleanData.sections.forEach((section, sIdx) => {
    if (section.type === 'grid' && userData.projects.length > 0) {
      section.items?.forEach((item, iIdx) => {
        if (userData.projects[iIdx]?.imageUrls) {
          item.imageUrls = userData.projects[iIdx].imageUrls;
        }
      });
    }
  });
  
  return cleanData;
}

export async function modifyPortfolio(current: GeneratedPortfolio, instruction: string): Promise<GeneratedPortfolio> {
  const prompt = `Current Portfolio: ${JSON.stringify(current)}. Instruction: "${instruction}". 
  Return updated JSON. Keep skills as string array.`;
  const result = await generateWithAI(prompt, true);
  const rawData = JSON.parse(result.trim().replace(/```json/g, "").replace(/```/g, ""));
  return sanitizePortfolioData(rawData);
}
