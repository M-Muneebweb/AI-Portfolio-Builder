
import React, { useState } from 'react';
import { UserInputData, ProjectItem, EducationItem, CertificateItem, InternshipItem } from '../types';
import { Upload, Plus, Trash2, ChevronDown, ChevronUp, ArrowRight, Briefcase, GraduationCap, Palette, User, Sparkles, X, Image as ImageIcon, Mail, Phone, Calendar, MapPin, Building2 } from 'lucide-react';

interface InputStepProps {
  data: UserInputData;
  onChange: (data: UserInputData) => void;
  onNext: () => void;
  loading: boolean;
}

export const InputStep: React.FC<InputStepProps> = ({ data, onChange, onNext, loading }) => {
  const [activeSection, setActiveSection] = useState<string>('basic'); 

  const updateField = (field: keyof UserInputData, value: any) => {
    onChange({ ...data, [field]: value });
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
      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 group ${
        activeSection === id 
        ? 'bg-blue-900/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
        : highlight 
           ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 border-blue-400/30'
           : 'bg-slate-800/40 border-slate-700 hover:border-slate-500 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeSection === id || highlight ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
          <Icon size={20} />
        </div>
        <div className="text-left">
           <div className={`font-bold text-lg ${activeSection === id ? 'text-blue-100' : highlight ? 'text-white' : 'text-slate-200'}`}>{title}</div>
           {subtitle && <div className={`text-xs font-medium ${highlight ? 'text-blue-200' : 'text-slate-400'}`}>{subtitle}</div>}
        </div>
      </div>
      <div className={`transition-transform duration-300 ${activeSection === id ? 'rotate-180 text-blue-400' : 'text-slate-500'}`}>
         <ChevronDown size={20} />
      </div>
    </button>
  );

  const ThemeCard = ({ name, color, desc, value }: any) => (
    <div 
       onClick={() => updateField('themePreference', value)}
       className={`cursor-pointer p-4 rounded-xl border-2 transition-all hover:scale-105 ${data.themePreference === value ? 'border-blue-500 bg-slate-800' : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'}`}
    >
        <div className="w-full h-12 rounded-lg mb-3" style={{ background: color }}></div>
        <h4 className="font-bold text-white text-sm">{name}</h4>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-12 animate-fade-in-up pb-40">
      
      {/* Header */}
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-2">
           <Sparkles size={14} className="mr-2" /> Powered by Puter.js AI
        </div>
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 tracking-tight">
          Portfolio Architect
        </h1>
        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
          Enter your details below and let AI build your website in seconds.
        </p>
      </div>

      <div className="space-y-6">

        {/* 1. Basic Info */}
        <SectionHeader id="basic" title="Personal Details" subtitle="Who are you?" icon={User} />
        <div className={`overflow-hidden transition-all duration-500 ${activeSection === 'basic' ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-2xl space-y-8 border border-slate-700/50 shadow-xl">
             <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32 rounded-full bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden group hover:border-blue-500 hover:bg-slate-800/80 transition-all cursor-pointer">
                  {data.photoUrl ? <img src={data.photoUrl} className="w-full h-full object-cover" /> : <Upload className="text-slate-500 group-hover:text-blue-400" size={32} />}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoUpload(e, 'profile')} />
                </div>
                <span className="text-sm text-slate-500">Upload Profile Photo</span>
             </div>
             
             <div className="grid md:grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Full Name</label>
                  <input placeholder="e.g. Sarah Connor" value={data.fullName} onChange={e => updateField('fullName', e.target.value)} className="input-field" />
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Target Role</label>
                  <input placeholder="e.g. Senior Frontend Engineer" value={data.role} onChange={e => updateField('role', e.target.value)} className="input-field" />
               </div>
             </div>
             
             {/* Contact Details */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Mail size={12}/> Email</label>
                   <input placeholder="you@example.com" value={data.email || ''} onChange={e => updateField('email', e.target.value)} className="input-field text-sm" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Phone size={12}/> Phone</label>
                   <input placeholder="+1 234 567 890" value={data.phone || ''} onChange={e => updateField('phone', e.target.value)} className="input-field text-sm" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2"><Calendar size={12}/> Age / Location</label>
                   <input placeholder="24, New York" value={data.age || ''} onChange={e => updateField('age', e.target.value)} className="input-field text-sm" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Professional Bio</label>
                <textarea placeholder="Tell us about yourself. Don't worry about the writing style, AI will polish it." value={data.bio} onChange={e => updateField('bio', e.target.value)} className="input-field min-h-[120px]" />
             </div>
             
             <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Key Skills (Comma Separated)</label>
                <input placeholder="React, TypeScript, Figma, Team Leadership..." value={data.skills} onChange={e => updateField('skills', e.target.value)} className="input-field" />
             </div>
          </div>
          </div>
        </div>
        
        {/* 1.5 Experience / Internships */}
        <SectionHeader id="internships" title="Experience & Internships" subtitle="Where have you worked?" icon={Building2} />
        <div className={`overflow-hidden transition-all duration-500 ${activeSection === 'internships' ? 'max-h-[1500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="p-1">
                <div className="glass p-8 rounded-2xl space-y-6 border border-slate-700/50 shadow-xl">
                    <p className="text-xs text-slate-400">Add your internships or full-time jobs here. The AI will build a timeline from this.</p>
                    
                    {data.internships.map((internship, idx) => (
                        <div key={internship.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-700 space-y-3 relative">
                            <button onClick={() => {
                                const newI = [...data.internships]; newI.splice(idx, 1); updateField('internships', newI);
                            }} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>

                            <div className="grid md:grid-cols-2 gap-4 pr-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Company / Org</label>
                                    <input placeholder="e.g. Google" value={internship.company} onChange={e => updateInternship(idx, 'company', e.target.value)} className="input-field text-sm" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Role / Position</label>
                                    <input placeholder="e.g. Software Intern" value={internship.role} onChange={e => updateInternship(idx, 'role', e.target.value)} className="input-field text-sm" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                                <input placeholder="e.g. Jun 2023 - Aug 2023" value={internship.duration} onChange={e => updateInternship(idx, 'duration', e.target.value)} className="input-field text-sm" />
                            </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">What did you do?</label>
                                <textarea placeholder="Built a feature using React..." value={internship.description} onChange={e => updateInternship(idx, 'description', e.target.value)} className="input-field text-sm min-h-[60px]" />
                            </div>
                        </div>
                    ))}
                    
                    <button onClick={addInternship} className="w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 text-sm font-bold">
                        <Plus size={16} /> Add Position
                    </button>
                    
                    <div className="relative flex items-center py-4">
                        <div className="flex-grow border-t border-slate-700"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs">OR PASTE TEXT SUMMARY</span>
                        <div className="flex-grow border-t border-slate-700"></div>
                    </div>
                    
                    <div className="space-y-2">
                        <textarea 
                        placeholder="Paste resume text if you prefer not to fill the form above..." 
                        value={data.experience} 
                        onChange={e => updateField('experience', e.target.value)} 
                        className="input-field min-h-[80px]" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* 2. Projects */}
        <SectionHeader id="projects" title="Projects" subtitle="Showcase your work" icon={Briefcase} />
        <div className={`overflow-hidden transition-all duration-500 ${activeSection === 'projects' ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-2xl space-y-6 border border-slate-700/50 shadow-xl">
            {data.projects.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30">
                    <p className="text-slate-400 mb-4">No projects added yet.</p>
                    <button onClick={addProject} className="px-4 py-2 bg-blue-600 rounded-full text-white text-sm font-bold hover:bg-blue-500">Add First Project</button>
                </div>
            )}
            {data.projects.map((proj, idx) => (
              <div key={proj.id} className="p-6 bg-slate-900/80 rounded-xl border border-slate-700 space-y-4 relative group hover:border-blue-500/50 transition-colors">
                 <button onClick={() => {
                     const newP = [...data.projects]; newP.splice(idx, 1); updateField('projects', newP);
                 }} className="absolute top-4 right-4 text-slate-600 hover:text-red-400 transition-colors p-2 bg-slate-800 rounded-lg"><Trash2 size={16} /></button>
                 
                 <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Upload Area */}
                    <div className="w-full md:w-1/3 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          {proj.imageUrls && proj.imageUrls.map((img, imgIdx) => (
                             <div key={imgIdx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-600 group/thumb">
                               <img src={img} className="w-full h-full object-cover" />
                               <button 
                                 onClick={() => removeProjectImage(idx, imgIdx)}
                                 className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity"
                               >
                                 <X size={16} />
                               </button>
                             </div>
                          ))}
                          {(proj.imageUrls?.length || 0) < 4 && (
                            <div className="aspect-square rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-500 hover:text-blue-400 hover:border-blue-500 transition-colors relative cursor-pointer">
                               <Plus size={20} />
                               <span className="text-[10px] mt-1">Add Img</span>
                               <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handlePhotoUpload(e, 'project', idx)} />
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 text-center">Up to 4 images per project</span>
                    </div>
                    
                    <div className="flex-1 space-y-4">
                       <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Project Title</label>
                             <input placeholder="e.g. E-Commerce App" value={proj.title} onChange={e => updateProject(idx, 'title', e.target.value)} className="input-field text-sm" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-slate-500 uppercase">Tech Stack</label>
                             <input placeholder="e.g. Next.js, Stripe" value={proj.techStack} onChange={e => updateProject(idx, 'techStack', e.target.value)} className="input-field text-sm" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                          <textarea placeholder="What problem did it solve?" value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} className="input-field text-sm min-h-[80px]" />
                       </div>
                       <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Link (Optional)</label>
                           <input placeholder="https://..." value={proj.link} onChange={e => updateProject(idx, 'link', e.target.value)} className="input-field text-sm" />
                       </div>
                    </div>
                 </div>
              </div>
            ))}
            {data.projects.length > 0 && (
                <button onClick={addProject} className="w-full py-4 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2">
                    <Plus size={18} /> Add Another Project
                </button>
            )}
          </div>
          </div>
        </div>

        {/* 3. Education & Certs */}
        <SectionHeader id="edu" title="Education & Certs" subtitle="Your credentials" icon={GraduationCap} />
        <div className={`overflow-hidden transition-all duration-500 ${activeSection === 'edu' ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-1">
          <div className="glass p-8 rounded-2xl space-y-8 border border-slate-700/50 shadow-xl">
            
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-blue-400 tracking-wider">Education History</h3>
                {data.education.map((edu, idx) => (
                <div key={edu.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <input placeholder="University / School" value={edu.institution} onChange={e => {const n=[...data.education]; n[idx].institution=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                    <input placeholder="Degree / Course" value={edu.degree} onChange={e => {const n=[...data.education]; n[idx].degree=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                    <input placeholder="Year (e.g. 2023)" value={edu.year} onChange={e => {const n=[...data.education]; n[idx].year=e.target.value; updateField('education', n)}} className="input-field text-sm" />
                </div>
                ))}
                <button onClick={() => updateField('education', [...data.education, { id: Date.now().toString(), institution: '', degree: '', year: '' }])} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1">+ ADD EDUCATION</button>
            </div>
            
            <div className="border-t border-slate-700"></div>
            
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase text-purple-400 tracking-wider">Certifications</h3>
                {data.certificates.map((cert, idx) => (
                <div key={cert.id} className="flex flex-col md:flex-row gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700 items-start">
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

        {/* 4. Theme Preference - ADVANCED VISUAL SELECTION */}
        <SectionHeader id="theme" title="Aesthetics" subtitle="Define your style" icon={Palette} />
        <div className={`overflow-hidden transition-all duration-500 ${activeSection === 'theme' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
           <div className="p-1">
           <div className="glass p-8 rounded-2xl space-y-6 border border-slate-700/50 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800">
             
             <label className="text-sm font-bold text-white block">Choose a Visual Style</label>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ThemeCard name="Corporate" color="linear-gradient(135deg, #1e293b 0%, #0f172a 100%)" desc="Professional, Clean, Blue & Slate" value="Professional Corporate, Blue and Slate tones, Clean Serif fonts" />
                <ThemeCard name="Cyberpunk" color="linear-gradient(135deg, #2e022d 0%, #1a0b2e 100%)" desc="Neon, Dark, Purple & Pink" value="Cyberpunk Neon, Dark background, Pink and Purple accents, Modern Mono fonts" />
                <ThemeCard name="Minimalist" color="linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)" desc="White, Airy, Black text" value="Minimalist White, Light gray background, Black text, Sans-serif" />
                <ThemeCard name="Swiss" color="linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)" desc="Bold Typography, Grid, Red & White" value="Swiss Design, Bold Typography, Red accents, Grid layouts" />
             </div>

             <div className="relative border-t border-slate-700 pt-4">
                 <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-2 text-xs text-slate-500">OR DESCRIBE CUSTOM</span>
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

      <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 glass border-t border-slate-700 z-50 flex justify-center backdrop-blur-xl bg-slate-900/80">
        <button
          onClick={onNext}
          disabled={loading || !data.fullName}
          className={`
            relative overflow-hidden group px-10 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all shadow-2xl hover:scale-105 active:scale-95
            ${loading || !data.fullName ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-white text-blue-900 hover:shadow-blue-500/50'}
          `}
        >
          {loading ? (
             <>
               <span className="animate-spin mr-2">✦</span> Architecting Portfolio...
             </>
          ) : (
             <>
               Generate Portfolio <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
             </>
          )}
          
          {!loading && data.fullName && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
          )}
        </button>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid #334155;
          border-radius: 0.75rem;
          padding: 0.875rem;
          color: white;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .input-field:focus {
          outline: none;
          background: rgba(15, 23, 42, 0.8);
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};
