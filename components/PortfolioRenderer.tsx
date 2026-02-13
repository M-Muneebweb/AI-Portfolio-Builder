
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedPortfolio, UserInputData } from '../types';
import { ExternalLink, Download, Mail, Send, Sparkles, MessageSquare, X, Code, RefreshCw, ChevronLeft, ChevronRight, Phone, MapPin } from 'lucide-react';
import { modifyPortfolio } from '../services/geminiService';
import JSZip from 'jszip';

interface PortfolioRendererProps {
  portfolio: GeneratedPortfolio;
  userData: UserInputData;
  onUpdate: (newPortfolio: GeneratedPortfolio) => void;
}

export const PortfolioRenderer: React.FC<PortfolioRendererProps> = ({ portfolio, userData, onUpdate }) => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hi! I'm your AI Design Assistant. I can help refine the look or content. What would you like to change?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Safe Theme Access
  const theme = portfolio.theme || {
    primaryColor: '#3b82f6',
    backgroundColor: '#0f172a',
    textColor: '#f8fafc',
    cardColor: '#1e293b',
    accentColor: '#8b5cf6',
    fontStyle: 'sans'
  };

  const styles = {
    bg: { backgroundColor: theme.backgroundColor },
    text: { color: theme.textColor },
    primary: { color: theme.primaryColor },
    card: { backgroundColor: theme.cardColor, borderColor: `${theme.primaryColor}20` },
    button: { backgroundColor: theme.primaryColor, color: theme.backgroundColor },
    accent: { color: theme.accentColor }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsModifying(true);

    try {
      const newPortfolio = await modifyPortfolio(portfolio, userMsg);
      onUpdate(newPortfolio);
      setMessages(prev => [...prev, { role: 'ai', text: "I've updated your portfolio! Check out the changes." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I had a bit of trouble connecting. Please try again." }]);
    } finally {
      setIsModifying(false);
    }
  };

  // --- HTML GENERATOR FOR EXPORT (VANILLA JS CAROUSEL) ---
  const generateStaticHTML = (pf: GeneratedPortfolio, ud: UserInputData, images: Map<string, string>) => {
    const getImgSrc = (url: string | undefined) => {
      if (!url) return '';
      if (images.has(url)) return `assets/${images.get(url)}`;
      return url; 
    };
    
    const contactEmail = ud.email || "contact@email.com";
    const contactPhone = ud.phone;
    const contactAge = ud.age;

    const sectionsHtml = pf.sections.map((section, idx) => {
      let content = '';

      if (section.type === 'grid') {
        content = `
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            ${section.items?.map((item, itemIdx) => {
                let imageGallery = '';
                if (item.imageUrls && item.imageUrls.length > 0) {
                   const imgs = item.imageUrls.map(url => getImgSrc(url));
                   imageGallery = `
                   <div class="carousel-container h-56 w-full relative overflow-x-auto snap-x snap-mandatory flex scrollbar-hide">
                      ${imgs.map(src => `<img src="${src}" class="w-full h-full object-cover flex-shrink-0 snap-center" />`).join('')}
                   </div>
                   ${imgs.length > 1 ? `<div class="text-xs text-center py-1 opacity-50">Swipe for more images</div>` : ''}
                   `;
                }

                return `
              <div class="group rounded-2xl overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl border" style="background-color: ${pf.theme.cardColor}; border-color: ${pf.theme.primaryColor}20">
                ${imageGallery}
                <div class="p-8 space-y-4">
                  <div class="flex justify-between items-start">
                    <h3 class="text-2xl font-bold leading-tight" style="color: ${pf.theme.textColor}">${item.title}</h3>
                    ${item.link ? `<a href="${item.link}" target="_blank" class="p-2 rounded-full hover:bg-white/10"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${pf.theme.accentColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>` : ''}
                  </div>
                  <p class="text-sm leading-relaxed opacity-70" style="color: ${pf.theme.textColor}">${item.description}</p>
                  <div class="flex flex-wrap gap-2 pt-2">
                    ${item.tags?.map(tag => `<span class="text-xs font-bold px-3 py-1 rounded-full opacity-80" style="background-color: ${pf.theme.backgroundColor}; color: ${pf.theme.primaryColor}">${tag}</span>`).join('') || ''}
                  </div>
                </div>
              </div>
            `}).join('')}
          </div>`;
      } else if (section.type === 'list') {
        content = `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${section.items?.map(item => {
               // Check if there is an image (Certificate)
               const imgUrl = (item.imageUrls && item.imageUrls.length > 0) ? getImgSrc(item.imageUrls[0]) : null;
               
               return `
              <div class="flex flex-col p-8 rounded-2xl border hover:border-opacity-50 transition-colors relative overflow-hidden" style="background-color: ${pf.theme.cardColor}; border-color: ${pf.theme.textColor}10">
                 <div class="flex gap-4 items-start z-10">
                    ${imgUrl ? `<img src="${imgUrl}" class="w-16 h-16 rounded-lg object-cover border border-white/10" />` : ''}
                    <div>
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                           <h3 class="text-xl font-bold" style="color: ${pf.theme.textColor}">${item.title}</h3>
                           ${item.subtitle ? `<span class="text-xs font-bold px-2 py-1 rounded opacity-70" style="background-color: ${pf.theme.backgroundColor}; color: ${pf.theme.textColor}">${item.subtitle}</span>` : ''}
                        </div>
                        <p class="text-sm opacity-60 leading-relaxed" style="color: ${pf.theme.textColor}">${item.description}</p>
                    </div>
                 </div>
              </div>
            `}).join('')}
          </div>`;
      } else if (section.type === 'timeline') {
        content = `
           <div class="space-y-0 relative border-l-2 ml-4 md:ml-0 md:border-l-0" style="border-color: ${pf.theme.primaryColor}30">
             ${section.items?.map(item => `
               <div class="md:flex gap-12 group relative pb-12 last:pb-0">
                 <div class="absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 md:hidden" style="background-color: ${pf.theme.primaryColor}; border-color: ${pf.theme.backgroundColor}"></div>
                 <div class="md:w-1/3 text-right hidden md:block pt-2 pr-12 relative border-r-2" style="border-color: ${pf.theme.primaryColor}30">
                    <div class="absolute -right-[9px] top-4 w-4 h-4 rounded-full border-4" style="background-color: ${pf.theme.primaryColor}; border-color: ${pf.theme.backgroundColor}"></div>
                    <span class="text-sm font-bold opacity-60 block mb-1" style="color: ${pf.theme.primaryColor}">${item.subtitle || ''}</span>
                    <div class="flex justify-end gap-2 flex-wrap">
                      ${item.tags?.map(t => `<span class="text-xs opacity-40" style="color: ${pf.theme.textColor}">#${t}</span>`).join('') || ''}
                    </div>
                 </div>
                 <div class="md:w-2/3 pl-6 md:pl-0 md:pt-1">
                    <span class="md:hidden text-xs font-bold opacity-60 block mb-1" style="color: ${pf.theme.primaryColor}">${item.subtitle || ''}</span>
                    <h3 class="text-xl font-bold mb-2" style="color: ${pf.theme.textColor}">${item.title}</h3>
                    <p class="text-sm opacity-70 leading-relaxed max-w-xl whitespace-pre-wrap" style="color: ${pf.theme.textColor}">${item.description}</p>
                 </div>
               </div>
             `).join('')}
           </div>`;
      }

      return `
        <div class="space-y-12 mb-32">
          <div class="flex flex-col items-start gap-2">
            <span class="text-sm font-bold tracking-widest uppercase opacity-60" style="color: ${pf.theme.accentColor}">0${idx + 1}</span>
            <h2 class="text-4xl font-bold" style="color: ${pf.theme.textColor}">${section.title}</h2>
          </div>
          ${content}
        </div>
      `;
    }).join('');

    // CLEAN EXPORT TEMPLATE
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${ud.fullName} - Portfolio</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
       body { font-family: 'Inter', sans-serif; background-color: ${pf.theme.backgroundColor}; color: ${pf.theme.textColor}; }
       .glass { background: ${pf.theme.cardColor}80; backdrop-filter: blur(10px); }
       .scrollbar-hide::-webkit-scrollbar { display: none; }
       .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
       .animate-fade-in-up { animation: fadeInUp 0.8s ease-out; }
       @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body class="min-h-screen">
    <nav class="fixed top-0 w-full z-40 backdrop-blur-xl border-b" style="border-color: ${pf.theme.textColor}10; background-color: ${pf.theme.backgroundColor}90">
        <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div class="text-xl font-bold tracking-tight" style="color: ${pf.theme.primaryColor}">${ud.fullName}</div>
            <a href="mailto:${contactEmail}" class="px-5 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 shadow-lg flex items-center" style="background-color: ${pf.theme.primaryColor}; color: ${pf.theme.backgroundColor}">
               Hire Me
            </a>
        </div>
    </nav>

    <section class="pt-40 pb-20 px-6 relative overflow-hidden">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] rounded-full blur-[120px] -z-10 opacity-30" style="background-color: ${pf.theme.accentColor}"></div>
        <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
             <div class="space-y-8 animate-fade-in-up">
                 <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm" style="border-color: ${pf.theme.accentColor}; color: ${pf.theme.accentColor}; background-color: ${pf.theme.accentColor}10">
                    ${pf.hero?.greeting}
                 </div>
                 <h1 class="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight" style="color: ${pf.theme.textColor}">${pf.hero?.headline}</h1>
                 <p class="text-xl opacity-80 leading-relaxed max-w-lg">${pf.hero?.subheadline}</p>
                 <div class="flex flex-wrap gap-3 pt-2">
                    ${pf.skills?.map(skill => `<span class="px-4 py-2 rounded-lg border text-sm font-medium backdrop-blur-md" style="border-color: ${pf.theme.textColor}20; color: ${pf.theme.textColor}; background-color: ${pf.theme.cardColor}50">${skill}</span>`).join('')}
                 </div>
             </div>
             <div class="relative flex justify-center md:justify-end">
                ${ud.photoUrl ? `<img src="${getImgSrc(ud.photoUrl)}" class="w-72 h-72 md:w-96 md:h-96 object-cover rounded-[2.5rem] shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700 border-4" style="border-color: ${pf.theme.cardColor}" />` : ''}
             </div>
        </div>
    </section>

    <section class="py-24 px-6 relative">
        <div class="max-w-4xl mx-auto text-center space-y-8 glass p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl">
            <h2 class="text-3xl font-bold">About Me</h2>
            <p class="text-lg md:text-xl leading-relaxed opacity-90">${pf.about?.content}</p>
        </div>
    </section>

    <div class="py-20 px-6 max-w-7xl mx-auto">
        ${sectionsHtml}
    </div>

    <footer class="py-16 mt-32 border-t" style="border-color: ${pf.theme.textColor}10; background-color: ${pf.theme.cardColor}50">
        <div class="max-w-7xl mx-auto px-6 flex flex-col items-center text-center opacity-80">
            <h3 class="text-2xl font-bold mb-6 tracking-tight">${ud.fullName}</h3>
            
            <div class="flex flex-wrap justify-center gap-8 mb-8 text-sm">
               ${contactEmail ? `<a href="mailto:${contactEmail}" class="flex items-center gap-2 hover:text-[${pf.theme.primaryColor}]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg> ${contactEmail}</a>` : ''}
               ${contactPhone ? `<span class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> ${contactPhone}</span>` : ''}
               ${contactAge ? `<span class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${contactAge}</span>` : ''}
            </div>

            <p class="mb-8 max-w-md text-sm opacity-50">Thanks for visiting.</p>
            <div class="text-xs pt-8 border-t w-full max-w-xs" style="border-color: ${pf.theme.textColor}20">Generated by GeminiFolio</div>
        </div>
    </footer>
</body>
</html>`;
  };

  const handleZipExport = async () => {
    setIsExporting(true);
    const zip = new JSZip();
    const imagesFolder = zip.folder("assets");
    const imageMap = new Map<string, string>(); 
    let imgCounter = 0;

    const saveImage = (dataUrl: string, prefix: string) => {
        if (dataUrl && dataUrl.startsWith('data:image')) {
            const filename = `${prefix}.png`; 
            const base64Data = dataUrl.split(',')[1];
            imagesFolder?.file(filename, base64Data, {base64: true});
            imageMap.set(dataUrl, filename);
        }
    };

    if (userData.photoUrl) {
       saveImage(userData.photoUrl, "profile");
    }

    portfolio.sections?.forEach((section, sIdx) => {
      section.items?.forEach((item, itemIdx) => {
        if (item.imageUrls && item.imageUrls.length > 0) {
            item.imageUrls.forEach((imgUrl, imgIdx) => {
                saveImage(imgUrl, `sec${sIdx}-item${itemIdx}-img${imgIdx}`);
            });
        }
      });
    });

    const htmlContent = generateStaticHTML(portfolio, userData, imageMap);
    zip.file("index.html", htmlContent);

    try {
      const content = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${userData.fullName.replace(/\s+/g, '_')}_Portfolio.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zip failed", e);
      alert("Failed to create ZIP file");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={styles.bg} className={`min-h-screen font-${theme.fontStyle || 'sans'} transition-colors duration-700 ease-in-out`}>
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 backdrop-blur-xl border-b transition-colors duration-500" style={{ borderColor: `${theme.textColor}10`, backgroundColor: `${theme.backgroundColor}90` }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tight" style={styles.primary}>
            {userData.fullName}
          </div>
          <div className="flex gap-3">
             <button 
                onClick={handleZipExport}
                disabled={isExporting}
                className="hidden md:flex items-center px-4 py-2 text-sm font-medium rounded-full border transition-all hover:bg-white/5 active:scale-95" 
                style={{ borderColor: `${theme.textColor}20`, color: theme.textColor }}
             >
                {isExporting ? <RefreshCw size={16} className="mr-2 animate-spin"/> : <Download size={16} className="mr-2" />} 
                {isExporting ? 'Zipping...' : 'Download Website'}
             </button>
             <a href={`mailto:${userData.email || ''}`} className="flex items-center px-5 py-2 text-sm font-bold rounded-full transition-transform hover:scale-105 shadow-lg" style={styles.button}>
                <Mail size={16} className="mr-2" /> Hire Me
             </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] rounded-full blur-[120px] -z-10 opacity-30 transition-colors duration-1000" style={{ backgroundColor: theme.accentColor }}></div>
        <div className="absolute bottom-0 right-0 w-[40vw] h-[40vh] rounded-full blur-[100px] -z-10 opacity-20 transition-colors duration-1000" style={{ backgroundColor: theme.primaryColor }}></div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm" style={{ borderColor: theme.accentColor, color: theme.accentColor, backgroundColor: `${theme.accentColor}10` }}>
              <Sparkles size={14} className="mr-2" />
              {portfolio.hero?.greeting || "Hello there"}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.1] tracking-tight" style={styles.text}>
              {portfolio.hero?.headline || "Creative Developer"}
            </h1>
            <p className="text-xl opacity-80 leading-relaxed max-w-lg" style={styles.text}>
              {portfolio.hero?.subheadline || "Building digital experiences that matter."}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              {portfolio.skills?.map((skill, idx) => (
                <span key={idx} className="px-4 py-2 rounded-lg border text-sm font-medium backdrop-blur-md hover:-translate-y-1 transition-transform" style={{ borderColor: `${theme.textColor}20`, color: theme.textColor, backgroundColor: `${theme.cardColor}50` }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <div className="relative flex justify-center md:justify-end animate-fade-in delay-100">
             <div className="relative z-10">
               {userData.photoUrl ? (
                  <img 
                    src={userData.photoUrl} 
                    alt={userData.fullName} 
                    className="w-72 h-72 md:w-96 md:h-96 object-cover rounded-[2.5rem] shadow-2xl rotate-3 hover:rotate-0 transition-all duration-700 border-4"
                    style={{ borderColor: theme.cardColor }}
                  />
               ) : (
                  <div className="w-72 h-72 md:w-96 md:h-96 rounded-[2.5rem] flex items-center justify-center border-4 shadow-2xl rotate-3 bg-gradient-to-br from-gray-800 to-gray-900" style={{ borderColor: theme.cardColor }}>
                    <span className="text-8xl">🚀</span>
                  </div>
               )}
               <div className="absolute inset-0 border-2 rounded-[2.5rem] -z-10 translate-x-4 translate-y-4 opacity-50" style={{ borderColor: theme.primaryColor }}></div>
             </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center space-y-8 glass p-8 md:p-12 rounded-3xl border border-white/5 shadow-2xl" style={{ backgroundColor: `${theme.cardColor}80` }}>
          <h2 className="text-3xl font-bold" style={styles.text}>About Me</h2>
          <p className="text-lg md:text-xl leading-relaxed opacity-90" style={styles.text}>
            {portfolio.about?.content || "I am a passionate professional dedicated to my craft."}
          </p>
        </div>
      </section>

      {/* Dynamic Sections */}
      <div className="space-y-32 py-20 px-6 max-w-7xl mx-auto">
        {portfolio.sections?.map((section, idx) => (
          <div key={idx} className="space-y-12">
            <div className="flex flex-col items-start gap-2">
              <span className="text-sm font-bold tracking-widest uppercase opacity-60" style={{ color: theme.accentColor }}>0{idx + 1}</span>
              <h2 className="text-4xl font-bold" style={styles.text}>{section.title}</h2>
            </div>

            {/* Grid (Projects) */}
            {section.type === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.items?.map((item, i) => (
                  <div key={i} className="group rounded-2xl overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl border" style={styles.card}>
                    {/* Image Carousel for Preview */}
                    {item.imageUrls && item.imageUrls.length > 0 && (
                      <div className="h-56 w-full overflow-hidden relative">
                         <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide">
                            {item.imageUrls.map((url, imgIdx) => (
                               <img key={imgIdx} src={url} alt={item.title} className="w-full h-full object-cover flex-shrink-0 snap-center" />
                            ))}
                         </div>
                         {item.imageUrls.length > 1 && <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">Swipe for more</div>}
                      </div>
                    )}
                    
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-2xl font-bold leading-tight" style={styles.text}>{item.title}</h3>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                            <ExternalLink size={20} style={styles.accent} />
                          </a>
                        )}
                      </div>
                      <p className="text-sm leading-relaxed opacity-70" style={styles.text}>{item.description}</p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {item.tags?.map((tag, t) => (
                          <span key={t} className="text-xs font-bold px-3 py-1 rounded-full opacity-80" style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List (Education/Certs) */}
            {section.type === 'list' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.items?.map((item, i) => {
                    const imgUrl = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : null;
                    return (
                    <div key={i} className="flex flex-col p-8 rounded-2xl border hover:border-opacity-50 transition-colors relative" style={{ ...styles.card, borderColor: `${theme.textColor}10` }}>
                       <div className="flex gap-4 items-start">
                          {imgUrl && (
                             <img src={imgUrl} className="w-16 h-16 rounded-lg object-cover border border-white/10 flex-shrink-0" alt="Credential" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <h3 className="text-xl font-bold" style={styles.text}>{item.title}</h3>
                                {item.subtitle && <span className="text-xs font-bold px-2 py-1 rounded opacity-70" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>{item.subtitle}</span>}
                            </div>
                            <p className="text-sm opacity-60 leading-relaxed" style={styles.text}>{item.description}</p>
                          </div>
                       </div>
                    </div>
                  )})}
               </div>
            )}
            
            {/* Timeline (Experience) */}
            {section.type === 'timeline' && (
               <div className="space-y-0 relative border-l-2 ml-4 md:ml-0 md:border-l-0" style={{ borderColor: `${theme.primaryColor}30` }}>
                 {section.items?.map((item, i) => (
                   <div key={i} className="md:flex gap-12 group relative pb-12 last:pb-0">
                     <div className="absolute -left-[9px] top-2 w-4 h-4 rounded-full border-4 border-[#0f172a] md:hidden" style={{ backgroundColor: theme.primaryColor }}></div>
                     
                     <div className="md:w-1/3 text-right hidden md:block pt-2 pr-12 relative border-r-2" style={{ borderColor: `${theme.primaryColor}30` }}>
                        <div className="absolute -right-[9px] top-4 w-4 h-4 rounded-full border-4" style={{ backgroundColor: theme.primaryColor, borderColor: theme.backgroundColor }}></div>
                        <span className="text-sm font-bold opacity-60 block mb-1" style={styles.primary}>{item.subtitle}</span>
                        {item.tags && (
                          <div className="flex justify-end gap-2 flex-wrap">
                            {item.tags.map((t, idx) => <span key={idx} className="text-xs opacity-40" style={styles.text}>#{t}</span>)}
                          </div>
                        )}
                     </div>

                     <div className="md:w-2/3 pl-6 md:pl-0 md:pt-1">
                        <span className="md:hidden text-xs font-bold opacity-60 block mb-1" style={styles.primary}>{item.subtitle}</span>
                        <h3 className="text-xl font-bold mb-2" style={styles.text}>{item.title}</h3>
                        <p className="text-sm opacity-70 leading-relaxed max-w-xl whitespace-pre-wrap" style={styles.text}>{item.description}</p>
                        <div className="md:hidden flex gap-2 mt-3 flex-wrap">
                            {item.tags?.map((t, idx) => <span key={idx} className="text-xs opacity-40" style={styles.text}>#{t}</span>)}
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        ))}
      </div>

      <footer className="py-16 mt-32 border-t" style={{ borderColor: `${theme.textColor}10`, backgroundColor: `${theme.cardColor}50` }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center opacity-80" style={styles.text}>
          <h3 className="text-2xl font-bold mb-6 tracking-tight">{userData.fullName}</h3>
          
          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
             {userData.email && (
                 <a href={`mailto:${userData.email}`} className="flex items-center gap-2 hover:opacity-100 opacity-70 transition-opacity">
                     <Mail size={16} /> {userData.email}
                 </a>
             )}
             {userData.phone && (
                 <span className="flex items-center gap-2 opacity-70">
                     <Phone size={16} /> {userData.phone}
                 </span>
             )}
             {userData.age && (
                 <span className="flex items-center gap-2 opacity-70">
                     <MapPin size={16} /> {userData.age}
                 </span>
             )}
          </div>

          <p className="mb-8 max-w-md text-sm opacity-50">Thanks for visiting.</p>
          <div className="text-xs pt-8 border-t w-full max-w-xs" style={{ borderColor: `${theme.textColor}20` }}>
             Generated by GeminiFolio
          </div>
        </div>
      </footer>

      {/* Helper Chatbot (Only visible in Preview, Not Exported) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-4 w-[90vw] md:w-96 rounded-2xl shadow-2xl overflow-hidden animate-fade-in border border-white/10 flex flex-col" style={{ backgroundColor: '#0f172a', height: '500px' }}>
            <div className="p-4 flex justify-between items-center border-b border-white/5 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center gap-3">
                 <div className="bg-white/20 p-1.5 rounded-lg"><Sparkles size={16} className="text-white" /></div>
                 <div>
                   <h3 className="text-white font-bold text-sm">Portfolio Assistant</h3>
                   <span className="text-xs text-blue-100 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online</span>
                 </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50 scrollbar-thin">
               {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                     msg.role === 'user' 
                     ? 'bg-blue-600 text-white rounded-tr-sm' 
                     : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-slate-700'
                   }`}>
                     {msg.text}
                   </div>
                 </div>
               ))}
               {isModifying && (
                 <div className="flex justify-start">
                    <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-sm border border-slate-700 flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-blue-400" />
                      <span className="text-xs text-slate-400">Updating portfolio...</span>
                    </div>
                 </div>
               )}
               <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 bg-slate-900 border-t border-slate-800">
              <div className="flex gap-2">
                <input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for changes..." 
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                  disabled={isModifying}
                />
                <button disabled={isModifying || !chatInput.trim()} type="submit" className="p-3 bg-blue-600 rounded-xl text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-900/20">
                  <Send size={18} />
                </button>
              </div>
            </form>
          </div>
        )}

        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className={`group flex items-center gap-3 px-6 py-4 rounded-full text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${chatOpen ? 'bg-slate-700' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600'}`}
        >
          {chatOpen ? (
             <X size={24} />
          ) : (
            <>
               <div className="relative">
                 <MessageSquare size={24} />
                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600"></span>
               </div>
               <div className="text-left hidden md:block">
                 <div className="text-xs font-medium opacity-80 uppercase tracking-wide">AI Designer</div>
                 <div className="font-bold text-sm">Edit Portfolio</div>
               </div>
            </>
          )}
        </button>
      </div>

    </div>
  );
};
