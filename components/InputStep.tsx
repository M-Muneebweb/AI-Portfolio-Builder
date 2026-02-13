
import React, { useState } from 'react';
import { UserInputData, ProjectItem, EducationItem, CertificateItem, InternshipItem } from '../types';
import { parseResumeFromText, extractTextFromPDF } from '../services/geminiService';
import { Upload, Plus, Trash2, ChevronDown, ArrowRight, Briefcase, GraduationCap, Palette, User, Sparkles, X, Image as ImageIcon, Mail, Phone, Calendar, Building2, Wand2, FileText, Loader2, CheckCircle2, FileUp, Clipboard } from 'lucide-react';

interface InputStepProps {
  data: UserInputData;
  onChange: (data: UserInputData) => void;
  onNext: () => void;
  loading: boolean;
}

export const InputStep: React.FC<InputStepProps> = ({ data, onChange, onNext, loading }) => {
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [showImportModal, setShowImportModal] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseStatus, setParseStatus] = useState<'idle'|'parsing'|'success'|'error'>('idle');
  const [importMode, setImportMode] = useState<'upload' | 'text'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);

  const updateField = (field: keyof UserInputData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleResumeProcess = async (textToParse: string) => {
    setIsParsing(true);
    setParseStatus('parsing');
    try {
      const parsedData = await parseResumeFromText(textToParse);
      onChange({
        ...data,
        ...parsedData,
        internships: parsedData.internships || [],
        projects: parsedData.projects || [],
        education: parsedData.education || [],
        certificates: parsedData.certificates || [],
      });
      setParseStatus('success');
      setTimeout(() => {
        setShowImportModal(false);
        setParseStatus('idle');
        setResumeText('');
      }, 1500);
    } catch (e) {
      setParseStatus('error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
       try {
         setIsParsing(true);
         setParseStatus('parsing');
         const text = await extractTextFromPDF(file);
         await handleResumeProcess(text);
       } catch (err) {
         console.error(err);
         setParseStatus('error');
         setIsParsing(false);
       }
    } else if (file) {
        alert("Please upload a PDF file.");
    }
  };

  const handleManualTextSubmit = () => {
    if (!resumeText.trim()) return;
    handleResumeProcess(resumeText);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'project' | 'cert', index: number = 0) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'project') {
          const newProjects = [...data.projects];
          if (!newProjects[index].imageUrls) newProjects[index].imageUrls = [];
          if (newProjects[index].imageUrls.length >= 4) {
            alert("Maximum 4 images per project");
            return;
          }
          newProjects[index].imageUrls.push(reader.result as string);
          updateField('projects', newProjects);
        } else if (type === 'cert') {
          const newCerts = [...data.certificates];
          newCerts[index].imageUrl = reader.result as string;
          updateField('certificates', newCerts);
        } else {
          updateField('photoUrl', reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProjectImage = (projectIndex: number, imageIndex: number) => {
    const newProjects = [...data.projects];
    newProjects[projectIndex].imageUrls.splice(imageIndex, 1);
    updateField('projects', newProjects);
  };

  const addProject = () => {
    const newProject: ProjectItem = { id: Date.now().toString(), title: '', description: '', imageUrls: [], link: '', techStack: '' };
    updateField('projects', [...data.projects, newProject]);
    if (activeSection !== 'projects') setActiveSection('projects');
  };

  const updateProject = (index: number, field: keyof ProjectItem, val: string) => {
    const newP = [...data.projects];
    // @ts-ignore
    newP[index][field] = val;
    updateField('projects', newP);
  };
  
  const addInternship = () => {
      const newInternship: InternshipItem = { id: Date.now().toString(), company: '', role: '', duration: '', description: '' };
      updateField('internships', [...data.internships, newInternship]);
  };
  
  const updateInternship = (index: number, field: keyof InternshipItem, val: string) => {
      const newI = [...data.internships];
      // @ts-ignore
      newI[index][field] = val;
      updateField('internships', newI);
  };

  const SectionHeader = ({ id, title, subtitle, icon: Icon, highlight }: any) => (
    <button 
      onClick={() => setActiveSection(activeSection === id ? '' : id)}
      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-500 group relative overflow-hidden ${
        activeSection === id 
        ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
        : highlight 
           ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-400/30'
           : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
      }`}
    >
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-500 ${activeSection === id ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>
      <div className="flex items-center gap-5 relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 shadow-lg ${activeSection === id || highlight ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white scale-110' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}>
          <Icon size={22} />
        </div>
        <div className="text-left">
           <div className={`font-bold text-lg tracking-tight transition-colors ${activeSection === id ? 'text-blue-100' : highlight ? 'text-white' : 'text-slate-200'}`}>{title}</div>
           {subtitle && <div className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-blue-200' : 'text-slate-500'}`}>{subtitle}</div>}
        </div>
      </div>
      <div className={`transition-transform duration-500 relative z-10 ${activeSection === id ? 'rotate-180 text-blue-400' : 'text-slate-500'}`}>
         <ChevronDown size={20} />
      </div>
    </button>
  );

  const ThemeCard = ({ name, color, desc, value }: any) => (
    <div 
       onClick={() => updateField('themePreference', value)}
       className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.03] group overflow-hidden ${data.themePreference === value ? 'border-blue-500 bg-slate-800 shadow-lg shadow-blue-500/20' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}
    >
        <div className="w-full h-16 rounded-lg mb-4 shadow-inner" style={{ background: color }}></div>
        <h4 className="font-bold text-white text-sm relative z-10">{name}</h4>
        <p className="text-[10px] text-slate-400 mt-1 relative z-10 font-medium uppercase tracking-wide">{desc}</p>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 pt-8 md:p-12 md:pt-12 animate-fade-in-up pb-40">
      
      {/* Hero Section */}
      <div className="text-center space-y-4 mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
        
        <div className="inline-flex items-center px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700 text-blue-400 text-xs font-bold tracking-widest uppercase mb-4 backdrop-blur-md shadow-xl">
           <Sparkles size={12} className="mr-2" /> AI-Powered V 2.0
        </div>
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-slate-400 tracking-tighter drop-shadow-sm">
          Portfolio Architect
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          The world's most advanced portfolio builder.
        </p>
        
        <div className="pt-6 flex justify-center">
            <button 
               onClick={() => setShowImportModal(true)}
               className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl text-white font-bold text-lg shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all overflow-hidden border border-white/10"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <div className="flex items-center gap-3 relative z-10">
                   <Wand2 className="animate-pulse" /> 
                   <span>Magic Import from Resume / CV</span>
                </div>
            </button>
        </div>
      </div>

      <div className="space-y-6 relative z-10">

        {/* 1. Basic Info */}
        <SectionHeader id="basic" title="Personal Details" subtitle="Core Identity" icon={User} />
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeSection === 'basic' ? 'max-h-[1200px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-3xl space-y-8 border border-slate-700/50 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
             <div className="flex flex-col items-center gap-4">
                <div className="relative w-36 h-36 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden group hover:border-blue-500 hover:bg-slate-800/80 transition-all cursor-pointer shadow-xl">
                  {data.photoUrl ? <img src={data.photoUrl} className="w-full h-full object-cover" /> : <Upload className="text-slate-500 group-hover:text-blue-400 transition-colors" size={36} />}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoUpload(e, 'profile')} />
                  <div className="absolute bottom-0 w-full bg-black/60 text-[10px] text-center text-white py-1 opacity-0 group-hover:opacity-100 transition-opacity">Change</div>
                </div>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="input-label">Full Name</label>
                  <input placeholder="e.g. Sarah Connor" value={data.fullName} onChange={e => updateField('fullName', e.target.value)} className="input-field" />
               </div>
               <div className="space-y-2">
                  <label className="input-label">Target Role</label>
                  <input placeholder="e.g. Senior Frontend Engineer" value={data.role} onChange={e => updateField('role', e.target.value)} className="input-field" />
               </div>
             </div>
             
             {/* Contact Details */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="input-label flex items-center gap-2"><Mail size={12}/> Email</label>
                   <input placeholder="you@example.com" value={data.email || ''} onChange={e => updateField('email', e.target.value)} className="input-field text-sm" />
                </div>
                <div className="space-y-2">
                   <label className="input-label flex items-center gap-2"><Phone size={12}/> Phone</label>
                   <input placeholder="+1 234 567 890" value={data.phone || ''} onChange={e => updateField('phone', e.target.value)} className="input-field text-sm" />
                </div>
                <div className="space-y-2">
                   <label className="input-label flex items-center gap-2"><Calendar size={12}/> Age / Location</label>
                   <input placeholder="24, New York" value={data.age || ''} onChange={e => updateField('age', e.target.value)} className="input-field text-sm" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="input-label">Professional Bio</label>
                <textarea placeholder="Tell us about yourself. Don't worry about the writing style, AI will polish it." value={data.bio} onChange={e => updateField('bio', e.target.value)} className="input-field min-h-[120px]" />
             </div>
             
             <div className="space-y-2">
                <label className="input-label">Key Skills (Comma Separated)</label>
                <input placeholder="React, TypeScript, Figma, Team Leadership..." value={data.skills} onChange={e => updateField('skills', e.target.value)} className="input-field" />
             </div>
          </div>
          </div>
        </div>
        
        {/* 1.5 Experience / Internships */}
        <SectionHeader id="internships" title="Experience & Internships" subtitle="Career Timeline" icon={Building2} />
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeSection === 'internships' ? 'max-h-[1500px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
            <div className="p-1">
                <div className="glass p-8 rounded-3xl space-y-6 border border-slate-700/50 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
                    <p className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded-lg border border-slate-700 inline-block">💡 Tip: Add your internships or full-time jobs here. The AI will build a stunning timeline.</p>
                    
                    {data.internships.map((internship, idx) => (
                        <div key={internship.id} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 space-y-4 relative hover:border-blue-500/30 transition-colors">
                            <button onClick={() => {
                                const newI = [...data.internships]; newI.splice(idx, 1); updateField('internships', newI);
                            }} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors bg-slate-800 p-2 rounded-lg"><Trash2 size={14} /></button>

                            <div className="grid md:grid-cols-2 gap-4 pr-10">
                                <div className="space-y-1">
                                    <label className="input-label">Company / Org</label>
                                    <input placeholder="e.g. Google" value={internship.company} onChange={e => updateInternship(idx, 'company', e.target.value)} className="input-field text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="input-label">Role / Position</label>
                                    <input placeholder="e.g. Software Intern" value={internship.role} onChange={e => updateInternship(idx, 'role', e.target.value)} className="input-field text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="input-label">Duration</label>
                                <input placeholder="e.g. Jun 2023 - Aug 2023" value={internship.duration} onChange={e => updateInternship(idx, 'duration', e.target.value)} className="input-field text-sm" />
                            </div>
                             <div className="space-y-1">
                                <label className="input-label">What did you do?</label>
                                <textarea placeholder="Built a feature using React..." value={internship.description} onChange={e => updateInternship(idx, 'description', e.target.value)} className="input-field text-sm min-h-[60px]" />
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={addInternship} className="w-full py-4 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 text-sm font-bold group">
                        <div className="bg-slate-800 p-1 rounded group-hover:bg-blue-500 transition-colors"><Plus size={16} /></div> Add Position
                    </button>
                    
                </div>
            </div>
        </div>

        {/* 2. Projects */}
        <SectionHeader id="projects" title="Projects" subtitle="Selected Works" icon={Briefcase} />
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeSection === 'projects' ? 'max-h-[2000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-3xl space-y-6 border border-slate-700/50 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
            {data.projects.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/30">
                    <p className="text-slate-400 mb-6">No projects added yet.</p>
                    <button onClick={addProject} className="px-6 py-3 bg-blue-600 rounded-full text-white text-sm font-bold hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all hover:scale-105">Add First Project</button>
                </div>
            )}
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-6 bg-slate-900/60 rounded-2xl border border-slate-700/50 space-y-4 relative group hover:border-blue-500/50 transition-colors">
                 <button onClick={() => {
                     const newP = [...data.projects]; newP.splice(idx, 1); updateField('projects', newP);
                 }} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors p-2 bg-slate-800 rounded-lg"><Trash2 size={16} /></button>
                 
                 <div className="flex flex-col md:flex-row gap-8">
                    {/* Image Upload Area */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          {proj.imageUrls && proj.imageUrls.map((img, imgIdx) => (
                             <div key={imgIdx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-600 group/thumb shadow-md">
                               <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110" />
                               <button 
                                 onClick={() => removeProjectImage(idx, imgIdx)}
                                 className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-sm"
                               >
                                 <X size={20} />
                               </button>
                             </div>
                          ))}
                          {(proj.imageUrls?.length || 0) < 4 && (
                            <div className="aspect-square rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500 transition-colors relative cursor-pointer bg-slate-800/30 hover:bg-slate-800/60">
                               <Plus size={24} />
                               <span className="text-[10px] mt-2 font-bold uppercase tracking-wide">Add Image</span>
                               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoUpload(e, 'project', idx)} />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">Max 4 images</span>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                       <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="input-label">Project Title</label>
                             <input placeholder="e.g. E-Commerce App" value={proj.title} onChange={e => updateProject(idx, 'title', e.target.value)} className="input-field text-sm" />
                          </div>
                          <div className="space-y-1">
                             <label className="input-label">Tech Stack</label>
                             <input placeholder="e.g. Next.js, Stripe" value={proj.techStack} onChange={e => updateProject(idx, 'techStack', e.target.value)} className="input-field text-sm" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="input-label">Description</label>
                          <textarea placeholder="What problem did it solve?" value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} className="input-field text-sm min-h-[80px]" />
                       </div>
                       <div className="space-y-1">
                           <label className="input-label">Link (Optional)</label>
                           <input placeholder="https://..." value={proj.link} onChange={e => updateProject(idx, 'link', e.target.value)} className="input-field text-sm" />
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            {data.projects.length > 0 && (
                <button onClick={addProject} className="w-full py-4 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 font-bold">
                    <Plus size={18} /> Add Another Project
                </button>
            )}
          </div>
          </div>
        </div>

        {/* 3. Education & Certs */}
        <SectionHeader id="edu" title="Education & Certs" subtitle="Credentials" icon={GraduationCap} />
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeSection === 'edu' ? 'max-h-[1000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-3xl space-y-8 border border-slate-700/50 shadow-2xl bg-slate-900/40 backdrop-blur-xl">
            
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-blue-400 tracking-widest flex items-center gap-2"><div className="w-8 h-[1px] bg-blue-400"></div> Education History</h3>
                {data.education.map((edu, idx) => (
                <div key={edu.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-blue-500/30 transition-colors">
                    <input placeholder="University / School" value={edu.institution} onChange={e => {const n=[...data.education]; n[idx].institution=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                    <input placeholder="Degree / Course" value={edu.degree} onChange={e => {const n=[...data.education]; n[idx].degree=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                    <input placeholder="Year (e.g. 2023)" value={edu.year} onChange={e => {const n=[...data.education]; n[idx].year=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                </div>
                ))}
                <button onClick={() => updateField('education', [...data.education, { id: Date.now().toString(), institution: '', degree: '', year: '' }])} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">+ ADD EDUCATION</button>
            </div>
            
            <div className="border-t border-slate-700"></div>
            
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-purple-400 tracking-widest flex items-center gap-2"><div className="w-8 h-[1px] bg-purple-400"></div> Certifications</h3>
                {data.certificates.map((cert, idx) => (
                <div key={cert.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700 items-start hover:border-purple-500/30 transition-colors">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                         <input placeholder="Certificate Name" value={cert.name} onChange={e => {const n=[...data.certificates]; n[idx].name=e.target.value; updateField('certificates', n)}} className="input-field text-sm" />
                         <input placeholder="Issuer (e.g. Google, AWS)" value={cert.issuer} onChange={e => {const n=[...data.certificates]; n[idx].issuer=e.target.value; updateField('certificates', n)}} className="input-field text-sm" />
                    </div>
                    {/* Certificate Image Upload */}
                    <div className="w-full md:w-auto flex-shrink-0">
                       <div className="relative w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center overflow-hidden hover:border-purple-500 transition-colors group">
                           {cert.imageUrl ? (
                               <img src={cert.imageUrl} className="w-full h-full object-cover" />
                           ) : (
                               <ImageIcon size={16} className="text-slate-500" />
                           )}
                           <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              onChange={(e) => handlePhotoUpload(e, 'cert', idx)} 
                              title="Upload Certificate Image"
                           />
                           {cert.imageUrl && (
                               <button 
                                 onClick={() => {
                                     const n = [...data.certificates];
                                     n[idx].imageUrl = undefined;
                                     updateField('certificates', n);
                                 }}
                                 className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                               >
                                   <X size={12} />
                               </button>
                           )}
                       </div>
                       <div className="text-[9px] text-center text-slate-500 mt-1">Img (Opt)</div>
                    </div>
                </div>
                ))}
                <button onClick={() => updateField('certificates', [...data.certificates, { id: Date.now().toString(), name: '', issuer: '', year: '' }])} className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">+ ADD CERTIFICATE</button>
            </div>

          </div>
          </div>
        </div>

        {/* 4. Theme Preference */}
        <SectionHeader id="theme" title="Aesthetics" subtitle="Visual Identity" icon={Palette} />
        <div className={`overflow-hidden transition-all duration-700 ease-in-out ${activeSection === 'theme' ? 'max-h-[800px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-4'}`}>
           <div className="p-1">
           <div className="glass p-8 rounded-3xl space-y-6 border border-slate-700/50 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800">
             
             <label className="text-sm font-bold text-white block uppercase tracking-wider">Choose a Visual Style</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ThemeCard name="Corporate" color="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" desc="Professional, Clean, Blue & Slate" value="Professional Corporate, Blue and Slate tones, Clean Serif fonts" />
                <ThemeCard name="Cyberpunk" color="linear-gradient(135deg, #2e022d 0%, #1a0b2e 100%)" desc="Neon, Dark, Purple & Pink" value="Cyberpunk Neon, Dark background, Pink and Purple accents, Modern Mono fonts" />
                <ThemeCard name="Minimalist" color="linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)" desc="White, Airy, Black text" value="Minimalist White, Light gray background, Black text, Sans-serif" />
                <ThemeCard name="Swiss" color="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" desc="Bold Typography, Grid, Red & White" value="Swiss Design, Bold Typography, Red accents, Grid layouts" />
             </div>

             <div className="relative border-t border-slate-700 pt-6">
                 <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-3 text-[10px] font-bold text-slate-500 tracking-widest uppercase rounded-full border border-slate-700">OR DESCRIBE CUSTOM</span>
                 <textarea 
                   value={data.themePreference} 
                   onChange={e => updateField('themePreference', e.target.value)} 
                   className="input-field min-h-[80px] text-sm mt-2" 
                   placeholder="e.g. 'Forest nature vibe with greens and browns'..." 
                 />
             </div>
           </div>
           </div>
        </div>

      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 left-0 w-full p-6 glass border-t border-slate-700/50 z-40 flex justify-center backdrop-blur-xl bg-slate-900/80 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        <button
          onClick={onNext}
          disabled={loading || !data.fullName}
          className={`
            relative overflow-hidden group px-12 py-5 rounded-2xl font-bold text-xl flex items-center gap-4 transition-all shadow-2xl hover:scale-105 active:scale-95
            ${loading || !data.fullName ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-white text-blue-900 shadow-blue-500/50'}
          `}
        >
          {loading ? (
             <>
               <Loader2 className="animate-spin" /> Architecting Portfolio...
             </>
          ) : (
             <>
               Generate Portfolio <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
             </>
          )}
          
          {!loading && data.fullName && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
          )}
        </button>
      </div>

      {/* IMPORT RESUME MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
           <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[95vh] overflow-y-auto">
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 sticky top-0 z-30">
                 <h3 className="text-xl font-bold text-white flex items-center gap-2"><FileText size={20} className="text-blue-400"/> Import Resume</h3>
                 <button onClick={() => setShowImportModal(false)} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-8 relative">
                 {/* Matrix Parsing Overlay */}
                 {isParsing && (
                    <div className="absolute inset-0 bg-slate-900/95 z-20 flex flex-col items-center justify-center text-center p-8 backdrop-blur-sm">
                       {parseStatus === 'parsing' && (
                         <>
                            <div className="relative mb-6">
                              <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <FileText className="text-blue-400 animate-pulse" size={24} />
                              </div>
                            </div>
                            <h4 className="text-2xl font-bold text-blue-400 mb-2">Analyzing Resume...</h4>
                            <p className="text-slate-400 text-sm">Extracting skills, experience, and timeline data.</p>
                            <div className="mt-8 font-mono text-xs text-green-500 opacity-70 animate-pulse">
                               [AI] Processing PDF Structure...
                            </div>
                         </>
                       )}
                       {parseStatus === 'success' && (
                         <div className="animate-bounce">
                            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
                            <h4 className="text-3xl font-bold text-white">Import Successful!</h4>
                         </div>
                       )}
                       {parseStatus === 'error' && (
                         <div className="animate-shake">
                            <X size={80} className="text-red-500 mx-auto mb-6" />
                            <h4 className="text-2xl font-bold text-white mb-2">Import Failed</h4>
                            <p className="text-slate-400 text-sm">Could not parse the PDF. Please try again or paste text manually.</p>
                            <button onClick={() => { setParseStatus('idle'); setIsParsing(false); }} className="mt-6 px-6 py-2 bg-slate-800 rounded-lg text-white text-sm font-bold">Try Again</button>
                         </div>
                       )}
                    </div>
                 )}

                 {/* Tab Switcher */}
                 <div className="flex gap-4 mb-6 p-1 bg-slate-950/50 rounded-xl border border-slate-800 inline-flex">
                    <button 
                       onClick={() => setImportMode('upload')}
                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${importMode === 'upload' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       Upload PDF
                    </button>
                    <button 
                       onClick={() => setImportMode('text')}
                       className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${importMode === 'text' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                       Paste Text
                    </button>
                 </div>

                 {importMode === 'upload' ? (
                     <div 
                       className={`relative w-full h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all bg-slate-950/30 ${isDragOver ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                       onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                       onDragLeave={() => setIsDragOver(false)}
                       onDrop={(e) => { e.preventDefault(); setIsDragOver(false); /* Handle drop here if fully implementing, for now click works */ }}
                     >
                        <input 
                           type="file" 
                           accept="application/pdf"
                           onChange={handleFileUpload}
                           className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-xl">
                           <FileUp className="text-blue-400" size={32} />
                        </div>
                        <h5 className="text-lg font-bold text-white mb-1">Drag & Drop or Click to Upload</h5>
                        <p className="text-slate-500 text-sm">Supported Format: PDF (Max 10MB)</p>
                     </div>
                 ) : (
                     <div className="relative">
                        <textarea 
                            value={resumeText} 
                            onChange={e => setResumeText(e.target.value)}
                            placeholder="Paste your resume text here..." 
                            className="w-full h-64 bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none transition-colors"
                        />
                        <div className="absolute bottom-4 right-4">
                            <button 
                               onClick={handleManualTextSubmit}
                               disabled={!resumeText.trim()}
                               className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors"
                            >
                               Analyze Text
                            </button>
                        </div>
                     </div>
                 )}
              </div>
           </div>
        </div>
      )}

      <style>{`
        .input-label {
           font-size: 0.7rem;
           font-weight: 700;
           color: #94a3b8;
           text-transform: uppercase;
           letter-spacing: 0.05em;
           margin-bottom: 0.5rem;
           display: block;
        }
        .input-field {
          width: 100%;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid #334155;
          border-radius: 1rem;
          padding: 1rem;
          color: white;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.95rem;
        }
        .input-field:focus {
          outline: none;
          background: rgba(15, 23, 42, 0.9);
          border-color: #60a5fa;
          box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.1);
          transform: translateY(-1px);
        }
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
        .animate-pulse-slow {
            animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
