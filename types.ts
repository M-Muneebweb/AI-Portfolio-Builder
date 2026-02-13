
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  imageUrls: string[]; // Changed from single URL to array
  link: string;
  techStack: string; // Comma separated
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  year: string;
}

export interface CertificateItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
  imageUrl?: string; // New optional field for certificate image
}

export interface InternshipItem {
  id: string;
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface UserInputData {
  fullName: string;
  role: string;
  bio: string;
  skills: string;
  experience: string; // Keep for general summary
  email: string;      // New
  phone: string;      // New
  age: string;        // New
  internships: InternshipItem[]; // New
  projects: ProjectItem[];
  education: EducationItem[];
  certificates: CertificateItem[];
  photoUrl: string | null;
  themePreference: string; 
}

export interface PortfolioSection {
  id: string;
  title: string;
  content?: string;
  type: 'text' | 'list' | 'grid' | 'timeline' | 'gallery';
  items?: Array<{
    title: string;
    description: string;
    tags?: string[];
    link?: string;
    imageUrls?: string[]; // Updated here too
    subtitle?: string; 
  }>;
}

export interface GeneratedPortfolio {
  hero: {
    greeting: string;
    headline: string;
    subheadline: string;
  };
  about: {
    content: string;
  };
  skills: string[];
  sections: PortfolioSection[];
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    cardColor: string;
    accentColor: string;
    fontStyle: 'sans' | 'serif' | 'mono';
  };
}
