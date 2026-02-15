import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Lightbulb, 
  Award, 
  GraduationCap, 
  DollarSign,
  FileText 
} from "lucide-react";

interface ProfileSection {
  id: string;
  title: string;
  content: string;
  sectionType: string;
  sortOrder: number;
  isVisible: boolean;
}

interface ProfileSectionsProps {
  sections: ProfileSection[];
}

// Get icon based on section type
function getSectionIcon(sectionType: string) {
  switch (sectionType) {
    case 'research_interests':
      return <Lightbulb className="w-5 h-5" />;
    case 'awards':
      return <Award className="w-5 h-5" />;
    case 'teaching':
      return <GraduationCap className="w-5 h-5" />;
    case 'grants':
      return <DollarSign className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
}

// Get color scheme based on section type
function getSectionColor(sectionType: string) {
  switch (sectionType) {
    case 'research_interests':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-600',
        border: 'border-blue-500/20'
      };
    case 'awards':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        border: 'border-amber-500/20'
      };
    case 'teaching':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-600',
        border: 'border-green-500/20'
      };
    case 'grants':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-600',
        border: 'border-purple-500/20'
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600',
        border: 'border-slate-500/20'
      };
  }
}

// Simple markdown-like renderer for content
function renderContent(content: string) {
  // Split by newlines and process each line
  const lines = content.split('\n');
  
  return lines.map((line, index) => {
    // Headers
    if (line.startsWith('### ')) {
      return <h4 key={index} className="font-semibold text-lg mt-4 mb-2">{line.slice(4)}</h4>;
    }
    if (line.startsWith('## ')) {
      return <h3 key={index} className="font-semibold text-xl mt-4 mb-2">{line.slice(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={index} className="font-bold text-2xl mt-4 mb-2">{line.slice(2)}</h2>;
    }
    
    // List items
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={index} className="ml-4 list-disc text-muted-foreground">
          {line.slice(2)}
        </li>
      );
    }
    
    // Numbered list items
    const numberedMatch = line.match(/^\d+\.\s/);
    if (numberedMatch) {
      return (
        <li key={index} className="ml-4 list-decimal text-muted-foreground">
          {line.slice(numberedMatch[0].length)}
        </li>
      );
    }
    
    // Empty lines
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    // Regular paragraphs - handle bold and italic safely
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|_.*?_)/g);
    
    return (
      <p key={index} className="text-muted-foreground mb-2">
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
            return <em key={i}>{part.slice(1, -1)}</em>;
          }
          return part;
        })}
      </p>
    );
  });
}

export default function ProfileSections({ sections }: ProfileSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Sort sections by sortOrder
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="py-12 bg-muted/30" id="about">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedSections.map((section) => {
            const colors = getSectionColor(section.sectionType);
            
            return (
              <Card 
                key={section.id}
                className={`border ${colors.border} shadow-sm hover:shadow-md transition-shadow`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className={`w-10 h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text}`}>
                      {getSectionIcon(section.sectionType)}
                    </div>
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    {renderContent(section.content)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
