import { UserInputData, GeneratedPortfolio } from "../types";

// Declare global Puter object from the script tag
declare const puter: any;

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

// Recursively replace base64 strings with placeholders
function detachImages(obj: any, imageMap: Map<string, string>, counter: { val: number }): any {
  // If it's a string looking like an image, strip it
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

// Recursively restore base64 strings from placeholders
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

export async function generatePortfolioData(userData: UserInputData): Promise<GeneratedPortfolio> {
  const projectsContext = userData.projects.map((p, i) => `Item ${i}: Title="${p.title}", Desc="${p.description}", Stack="${p.techStack}", Link="${p.link}"`).join('\n');
  const eduContext = userData.education.map(e => `Edu: ${e.degree} at ${e.institution} (${e.year})`).join('\n');
  const certContext = userData.certificates.map(c => `Cert: ${c.name} from ${c.issuer} (${c.year})`).join('\n');
  
  // Combine structured internships with the text summary if available
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
    // Puter AI Call
    const response = await puter.ai.chat(prompt);
    
    // Puter returns a message object, we need the content text
    const text = response?.message?.content || response?.toString() || "";

    let cleanText = text.trim();
    // Remove markdown code blocks if present
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
    
    // Defaults to prevent crashes
    if (!data.hero) data.hero = { greeting: "Hi, I'm", headline: userData.fullName || "Creator", subheadline: userData.role || "Welcome" };
    if (!data.about) data.about = { content: userData.bio || "Welcome to my portfolio." };
    if (!data.skills || !Array.isArray(data.skills)) data.skills = userData.skills ? userData.skills.split(',').map(s=>s.trim()) : [];
    if (!data.sections || !Array.isArray(data.sections)) data.sections = [];
    
    if (!data.theme) data.theme = FALLBACK_PORTFOLIO.theme;
    data.theme.backgroundColor = data.theme.backgroundColor || "#0f172a";
    data.theme.textColor = data.theme.textColor || "#f8fafc";
    data.theme.primaryColor = data.theme.primaryColor || "#3b82f6";

    // --- RE-ATTACH USER IMAGES (Projects & Certificates) ---
    data.sections.forEach(section => {
      // 1. Projects (Grid)
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

      // 2. Certificates (List)
      // Check if this section seems to contain certificates
      if (section.type === 'list' && (section.title.toLowerCase().includes('cert') || section.title.toLowerCase().includes('education'))) {
          if (section.items && userData.certificates.length > 0) {
            section.items.forEach(item => {
               // Fuzzy match title or subtitle to certificate name
               const originalCert = userData.certificates.find(c => 
                  item.title.toLowerCase().includes(c.name.toLowerCase()) || 
                  (item.subtitle && item.subtitle.toLowerCase().includes(c.name.toLowerCase()))
               );
               
               if (originalCert && originalCert.imageUrl) {
                   // Attach the image URL. The portfolio renderer looks for 'imageUrls' array.
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
  // 1. Strip images to reduce token count
  const imageMap = new Map<string, string>();
  const counter = { val: 0 };
  const lightweightPortfolio = detachImages(currentPortfolio, imageMap, counter);

  const prompt = `
    Current Portfolio JSON (Images are hidden as placeholders like ##IMG_DATA_x, DO NOT TOUCH THEM):
    ${JSON.stringify(lightweightPortfolio)}

    User Instruction: "${userInstruction}"

    Task:
    Modify the JSON to satisfy the user's request.
    - If changing theme, update 'theme'.
    - If rewriting text, update 'about' or 'hero'.
    - DO NOT REMOVE or CHANGE the "imageUrls" placeholders. Keep them exactly as is.
    - If expanding experience, generate professional bullet points.

    ${JSON_STRUCTURE_INSTRUCTION}
  `;

  try {
    const response = await puter.ai.chat(prompt);
    const text = response?.message?.content || response?.toString() || "";
    
    let cleanText = text.trim();
    if (cleanText.includes("```")) {
      cleanText = cleanText.replace(/```json/g, "").replace(/```/g, "");
    }

    const data = JSON.parse(cleanText) as GeneratedPortfolio;
    
    // Safety checks
    if (!data.sections) data.sections = currentPortfolio.sections || [];
    if (!data.theme) data.theme = currentPortfolio.theme;
    if (!data.hero) data.hero = currentPortfolio.hero;
    
    // 2. Restore images
    const fullPortfolio = reattachImages(data, imageMap);

    return fullPortfolio;
  } catch(error) {
    console.error("Modification Error:", error);
    return currentPortfolio;
  }
}
