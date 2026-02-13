import React, { useState } from 'react';
import { UserInputData, GeneratedPortfolio } from './types';
import { InputStep } from './components/InputStep';
import { PortfolioRenderer } from './components/PortfolioRenderer';
import { generatePortfolioData } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [loading, setLoading] = useState(false);
  
  const [userData, setUserData] = useState<UserInputData>({
    fullName: '',
    role: '',
    bio: '',
    skills: '',
    experience: '',
    email: '',
    phone: '',
    age: '',
    internships: [],
    projects: [],
    education: [],
    certificates: [],
    photoUrl: null,
    themePreference: ''
  });

  const [portfolio, setPortfolio] = useState<GeneratedPortfolio | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePortfolioData(userData);
      setPortfolio(result);
      setStep('preview');
    } catch (error) {
      console.error(error);
      alert("Oops! The AI couldn't generate the portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePortfolio = (newPortfolio: GeneratedPortfolio) => {
    setPortfolio(newPortfolio);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      {step === 'input' && (
        <div className="relative min-h-screen">
          {/* Background decoration */}
          <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
             <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10 w-full">
            <InputStep 
              data={userData} 
              onChange={setUserData} 
              onNext={handleGenerate}
              loading={loading}
            />
          </div>
        </div>
      )}

      {step === 'preview' && portfolio && (
        <div className="animate-fade-in">
          <PortfolioRenderer 
            portfolio={portfolio} 
            userData={userData} 
            onUpdate={handleUpdatePortfolio}
          />
          
          {/* Back Button (Hidden behind chatbot usually, so placed top left) */}
          <div className="fixed top-4 left-4 z-50">
            <button 
              onClick={() => setStep('input')}
              className="bg-black/20 hover:bg-black/40 backdrop-blur text-white/50 hover:text-white px-4 py-2 rounded-full text-xs font-medium transition-all"
            >
              ← Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;