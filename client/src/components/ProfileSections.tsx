import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Lightbulb,
  Award,
  GraduationCap,
  DollarSign,
  FileText
} from "lucide-react";
import SectionContent from "@/lib/renderSectionContent";

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

export default function ProfileSections({ sections }: ProfileSectionsProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  // Sort sections by sortOrder
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedSections.map((section) => {
            const colors = getSectionColor(section.sectionType);

            return (
              <Card
                key={section.id}
                id={section.id}
                className={`border ${colors.border} shadow-sm hover:shadow-md transition-shadow scroll-mt-24`}
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
                    <SectionContent content={section.content} />
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
