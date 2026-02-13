
import { UserInputData, GeneratedPortfolio } from "../types";

// Declare global Puter object from the script tag
declare const puter: any;
declare const pdfjsLib: any;

const FALLBACK_PORTFOLIO: GeneratedPortfolio = {
  hero: { greeting: "Hello", headline: "Portfolio", subheadline: "Welcome to my work" },
  about: { content: "I am a professional." },
  skills: ["Hard Work"],
  sections: [],
  theme: {
    primaryColor: "#3b82f6",
    backgroundColor: "#0f172a",
    textColor: "#f8fafc",
    cardColor: "#1e293b",
    accentColor: "#8b5cf6",
    fontStyle: "sans"
  }
};

const JSON_STRUCTURE_INSTRUCTION = `
You must output ONLY valid JSON. Do not include markdown formatting like \`\`\`json.
The JSON must follow this exact structure:
{
  "hero": { "greeting": "string", "headline": "string", "subheadline": "string" },
  "about": { "content": "string" },
  "skills": ["string", "string"],
  "theme": { 
    "primaryColor": "hex_code", 
    "backgroundColor": "hex_code", 
    "textColor": "hex_code", 
    "cardColor": "hex_code", 
    "accentColor": "hex_code", 
    "fontStyle": "sans" | "serif" | "mono" 
  },
  "sections": [
    {
      "id": "string",
      "title": "string",
      "type": "grid" | "list" | "timeline",
      "items": [
        {
          "title": "string",
          "description": "string",
          "subtitle": "string (optional)",
          "tags": ["string"],
          "link": "string (optional)",
          "imageUrls": ["string"]
        }
      ]
    }
  ]
}
`;

// --- HELPER FUNCTIONS FOR TOKEN OPTIMIZATION ---
const IMAGE_PLACEHOLDER_PREFIX = "##IMG_DATA_";

function detachImages(obj: any, imageMap: Map<string, string>, counter: { val: number }): any {
  if (typeof obj === 'string' && obj.startsWith('data:image')) {
      const placeholder = `${IMAGE_PLACEHOLDER_PREFIX}${counter.val++}`;
      imageMap.set(placeholder, obj);
      return placeholder;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => detachImages(item, imageMap, counter));
  } 
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
       newObj[key] = detachImages(obj[key], imageMap, counter);
    }
    return newObj;
  }
  return obj;
}

function reattachImages(obj: any, imageMap: Map<string, string>): any {
  if (typeof obj === 'string' && obj.startsWith(IMAGE_PLACEHOLDER_PREFIX)) {
      return imageMap.get(obj) || obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => reattachImages(item, imageMap));
  } 
  if (typeof obj === 'object' && obj !== null) {
    const newObj: any = {};
    for (const key in obj) {
       newObj[key] = reattachImages(obj[key], imageMap);
    }
    return newObj;
  }
  return obj;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  if (!file) return "";
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    // @ts-ignore
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }
    return fullText;
  } catch (e) {
    console.error("PDF Parsing Error", e);
    throw new Error("Could not parse PDF. Please try copying the text instead.");
  }
}

export async function parseResumeFromText(text: string): Promise<Partial<UserInputData>> {
  const prompt = `
    Analyze the following Resume/CV Text and extract structured data for a portfolio website.
    
    Resume Text:
    "${text.substring(0, 8000)}"

    Output ONLY valid JSON matching this structure. Do not use markdown blocks.
    {
      "fullName": "string",
      "role": "string (Target Job Title)",
      "email": "string",
      "phone": "string",
      "bio": "string (A professional summary, max 400 chars)",
      "skills": "string (Comma separated list)",
      "experience": "string (A short summary of work history)",
      "internships": [
        { "id": "1", "company": "string", "role": "string", "duration": "string", "description": "string" }
      ],
      "projects": [
         { "id": "1", "title": "string", "description": "string", "techStack": "string", "link": "" }
      ],
      "education": [
         { "id": "1", "institution": "string", "degree": "string", "year": "string" }
      ],
      "certificates": [
         { "id": "1", "name": "string", "issuer": "string", "year": "string" }
      ]
    }
  `;

  try {
    const response = await puter.ai.chat(prompt);
    const resultText = response?.message?.content || response?.toString() || "";
    let cleanText = resultText.trim().replace(/```json/g, "").replace(/```/g, "");
    // Try to catch common JSON errors (like trailing commas) if simple parse fails?
    // For now, assume Puter returns valid JSON as instructed.
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Resume Parse Error", e);
    throw new Error("Failed to parse resume content from AI.");
  }
}

export async function generatePortfolioData(userData: UserInputData): Promise<GeneratedPortfolio> {
  const projectsContext = userData.projects.map((p, i) => `Item ${i}: Title="${p.title}", Desc="${p.description}", Stack="${p.techStack}", Link="${p.link}"`).join('\n');
  const eduContext = userData.education.map(e => `Edu: ${e.degree} at ${e.institution} (${e.year})`).join('\n');
  const certContext = userData.certificates.map(c => `Cert: ${c.name} from ${c.issuer} (${c.year})`).join('\n');
  const internshipContext = userData.internships.map(i => `Work: ${i.role} at ${i.company} (${i.duration}) - ${i.description}`).join('\n');
  const fullExperienceContext = `Detailed Internships:\n${internshipContext}\n\nAdditional Experience Text:\n${userData.experience}`;

  const prompt = `
    You are an elite Portfolio Architect.
    
    Target User: ${userData.fullName} (${userData.role})
    Bio: ${userData.bio}
    Contact Info: Email: ${userData.email}, Phone: ${userData.phone}, Location/Age: ${userData.age}
    Theme Vibe: ${userData.themePreference}

    CRITICAL INSTRUCTIONS:
    1. **Preserve Data**: Do NOT summarize or shorten the user's project descriptions. Use them exactly.
    2. **Structure**:
       - 'hero': Catchy headline.
       - 'about': Professional version of bio.
       - 'grid' section: For Projects. Title it "Selected Works". **Must contain exactly ${userData.projects.length} items.**
       - 'timeline' section: For Experience. Use the provided Internships/Work data. Title it "Experience" or "Career Timeline". If internship details are provided, make each one an item. If description is short, expand it to 2-3 professional bullet points.
       - 'list' section: For Education/Certs.
    3. **Theme**: High-contrast colors based on '${userData.themePreference}'.
    
    Raw Data:
    Projects: ${projectsContext}
    Education: ${eduContext}
    Certs: ${certContext}
    Experience: ${fullExperienceContext}

    ${JSON_STRUCTURE_INSTRUCTION}
  `;

  try {
    const response = await puter.ai.chat(prompt);
    const text = response?.message?.content || response?.toString() || "";
    let cleanText = text.trim();
    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "");
    }

    let data: GeneratedPortfolio;
    try {
      data = JSON.parse(cleanText) as GeneratedPortfolio;
    } catch (e) {
      console.error("JSON Parse Error", e, cleanText);
      return FALLBACK_PORTFOLIO;
    }
    
    if (!data) return FALLBACK_PORTFOLIO;
    
    if (!data.hero) data.hero = { greeting: "Hi, I'm", headline: userData.fullName || "Creator", subheadline: userData.role || "Welcome" };
    if (!data.about) data.about = { content: userData.bio || "Welcome to my portfolio." };
    if (!data.skills || !Array.isArray(data.skills)) data.skills = userData.skills ? userData.skills.split(',').map(s=>s.trim()) : [];
    if (!data.sections || !Array.isArray(data.sections)) data.sections = [];
    
    if (!data.theme) data.theme = FALLBACK_PORTFOLIO.theme;
    data.theme.backgroundColor = data.theme.backgroundColor || "#0f172a";
    data.theme.textColor = data.theme.textColor || "#f8fafc";
    data.theme.primaryColor = data.theme.primaryColor || "#3b82f6";

    // --- RE-ATTACH USER IMAGES ---
    data.sections.forEach(section => {
      // Projects
      if (section.type === 'grid' || section.title.toLowerCase().includes('work') || section.title.toLowerCase().includes('project')) {
        if (section.items && userData.projects.length > 0) {
           section.items.forEach((item, index) => {
              let original = userData.projects.find(p => p.title.trim().toLowerCase() === item.title.trim().toLowerCase());
              if (!original && index < userData.projects.length) original = userData.projects.find(p => item.title.toLowerCase().includes(p.title.toLowerCase()));
              if (!original && index < userData.projects.length) original = userData.projects[index];

              if (original) {
                 if (original.imageUrls && original.imageUrls.length > 0) {
                    item.imageUrls = original.imageUrls;
                 }
                 if (original.link) item.link = original.link; 
              }
           });
        }
      }
      // Certificates
      if (section.type === 'list' && (section.title.toLowerCase().includes('cert') || section.title.toLowerCase().includes('education'))) {
          if (section.items && userData.certificates.length > 0) {
            section.items.forEach(item => {
               const originalCert = userData.certificates.find(c => 
                  item.title.toLowerCase().includes(c.name.toLowerCase()) || 
                  (item.subtitle && item.subtitle.toLowerCase().includes(c.name.toLowerCase()))
               );
               if (originalCert && originalCert.imageUrl) {
                   item.imageUrls = [originalCert.imageUrl];
               }
            });
          }
      }
    });

    return data;
  } catch (error) {
    console.error("Puter AI Error:", error);
    return FALLBACK_PORTFOLIO;
  }
}

export async function modifyPortfolio(currentPortfolio: GeneratedPortfolio, userInstruction: string): Promise<GeneratedPortfolio> {
  const imageMap = new Map<string, string>();
  const counter = { val: 0 };
  const lightweightPortfolio = detachImages(currentPortfolio, imageMap, counter);

  const prompt = `
    Current Portfolio JSON (Images are hidden as placeholders):
    ${JSON.stringify(lightweightPortfolio)}

    User Instruction: "${userInstruction}"

    Task:
    Modify the JSON to satisfy the user's request.
    ${JSON_STRUCTURE_INSTRUCTION}
  `;

  try {
    const response = await puter.ai.chat(prompt);
    const text = response?.message?.content || response?.toString() || "";
    let cleanText = text.trim().replace(/```json/g, "").replace(/```/g, "");

    const data = JSON.parse(cleanText) as GeneratedPortfolio;
    
    if (!data.sections) data.sections = currentPortfolio.sections || [];
    if (!data.theme) data.theme = currentPortfolio.theme;
    if (!data.hero) data.hero = currentPortfolio.hero;
    
    const fullPortfolio = reattachImages(data, imageMap);
    return fullPortfolio;
  } catch(error) {
    console.error("Modification Error:", error);
    return currentPortfolio;
  }
}
