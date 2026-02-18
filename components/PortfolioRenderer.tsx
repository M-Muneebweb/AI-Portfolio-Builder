
import React, { useState, useRef, useEffect } from 'react';
import { GeneratedPortfolio, UserInputData } from '../types';
import { ExternalLink, Download, Mail, Send, Sparkles, MessageSquare, X, RefreshCw } from 'lucide-react';
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
    { role: 'ai', text: "I'm your design assistant. Want to change colors or wording? Just ask!" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const theme = portfolio.theme || {
    primaryColor: '#3b82f6',
    backgroundColor: '#050b14',
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
      setMessages(prev => [...prev, { role: 'ai', text: "Changes applied! How does it look?" }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', text: "I couldn't process that update. Try again?" }]);
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div style={styles.bg} className={`min-h-screen font-${theme.fontStyle || 'sans'} transition-colors duration-700`}>
      <nav className="fixed top-0 w-full z-40 backdrop-blur-xl border-b border-white/5" style={{ backgroundColor: `${theme.backgroundColor}95` }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold tracking-tighter" style={styles.primary}>{userData.fullName}</div>
          <div className="flex gap-4">
             <button onClick={() => {}} className="hidden md:flex items-center px-4 py-2 text-xs font-bold rounded-full border border-white/10" style={styles.text}>
                <Download size={14} className="mr-2" /> Download Source
             </button>
             <a href={`mailto:${userData.email}`} className="px-5 py-2 text-xs font-bold rounded-full shadow-lg transition-transform hover:scale-105" style={styles.button}>Hire Me</a>
          </div>
        </div>
      </nav>

      <section className="pt-40 pb-20 px-6 relative min-h-[90vh] flex items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vh] rounded-full blur-[120px] -z-10 opacity-30" style={{ backgroundColor: theme.accentColor }}></div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center w-full">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border" style={{ borderColor: theme.accentColor, color: theme.accentColor, backgroundColor: `${theme.accentColor}10` }}>
              <Sparkles size={12} className="mr-2" /> {portfolio.hero?.greeting}
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight" style={styles.text}>{portfolio.hero?.headline}</h1>
            <p className="text-xl opacity-80 leading-relaxed max-w-lg" style={styles.text}>{portfolio.hero?.subheadline}</p>
            <div className="flex flex-wrap gap-2 pt-4">
              {portfolio.skills?.map((skill, idx) => (
                <span key={idx} className="px-4 py-2 rounded-xl border border-white/5 text-xs font-bold backdrop-blur-md" style={{ ...styles.text, backgroundColor: `${theme.cardColor}50` }}>
                  {typeof skill === 'string' ? skill : String(skill)}
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
             {userData.photoUrl && <img src={userData.photoUrl} className="w-80 h-80 md:w-[450px] md:h-[450px] object-cover rounded-[3rem] shadow-2xl border-4" style={{ borderColor: theme.cardColor }} />}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass p-12 md:p-20 rounded-[3rem]">
          <h2 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-8" style={styles.text}>About</h2>
          <p className="text-2xl md:text-4xl leading-tight font-medium" style={styles.text}>{portfolio.about?.content}</p>
        </div>
      </section>

      <div className="space-y-32 py-20 px-6 max-w-7xl mx-auto">
        {portfolio.sections?.map((section, idx) => (
          <div key={idx} className="space-y-12">
            <div className="flex items-center gap-4">
              <span className="text-xs font-black opacity-30" style={styles.text}>0{idx + 1}</span>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight" style={styles.text}>{section.title}</h2>
            </div>
            {section.type === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.items?.map((item, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden border transition-all hover:-translate-y-2" style={styles.card}>
                    {item.imageUrls?.[0] && <img src={item.imageUrls[0]} className="h-56 w-full object-cover" />}
                    <div className="p-8 space-y-4">
                      <h3 className="text-2xl font-bold" style={styles.text}>{item.title}</h3>
                      <p className="text-sm opacity-70 leading-relaxed" style={styles.text}>{item.description}</p>
                      <div className="flex flex-wrap gap-2 pt-4">
                        {item.tags?.map((tag, t) => (
                          <span key={t} className="text-[10px] font-bold px-2 py-1 rounded-md uppercase" style={{ backgroundColor: theme.backgroundColor, color: theme.primaryColor }}>{typeof tag === 'string' ? tag : String(tag)}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'timeline' && (
               <div className="space-y-8 border-l border-white/10 ml-4 md:ml-0 md:border-l-0">
                  {section.items?.map((item, i) => (
                    <div key={i} className="md:flex gap-12 relative pb-12 group">
                       <div className="md:w-1/3 text-right hidden md:block pr-12 pt-2 opacity-50 text-sm font-bold" style={styles.text}>{item.subtitle}</div>
                       <div className="md:w-2/3 pl-8 md:pl-0">
                          <div className="absolute left-[-5px] md:left-[-6px] top-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.primaryColor }}></div>
                          <h3 className="text-2xl font-bold mb-2" style={styles.text}>{item.title}</h3>
                          <p className="text-sm opacity-70 max-w-2xl" style={styles.text}>{item.description}</p>
                       </div>
                    </div>
                  ))}
               </div>
            )}
          </div>
        ))}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
         {chatOpen && (
           <div className="mb-4 w-[90vw] md:w-96 rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col bg-slate-900 h-[450px]">
              <div className="p-4 bg-blue-600 text-white font-bold flex justify-between items-center">
                <span className="flex items-center gap-2"><Sparkles size={16}/> AI Editor</span>
                <button onClick={() => setChatOpen(false)}><X size={18}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-xs ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{m.text}</div>
                 </div>)}
                 {isModifying && <div className="text-[10px] text-blue-400 animate-pulse">Syncing changes...</div>}
              </div>
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/5">
                 <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="e.g. 'Make the background darker'" className="w-full bg-slate-950 p-3 rounded-xl text-white text-xs outline-none border border-white/10 focus:border-blue-500" />
              </form>
           </div>
         )}
         <button onClick={() => setChatOpen(!chatOpen)} className="p-4 rounded-full bg-blue-600 text-white shadow-2xl hover:scale-105 transition-transform">
            {chatOpen ? <X size={24}/> : <MessageSquare size={24}/>}
         </button>
      </div>
    </div>
  );
};
