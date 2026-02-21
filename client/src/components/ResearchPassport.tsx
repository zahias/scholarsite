import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, QrCode, BookOpen, Quote, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResearchPassportProps {
  openalexId: string;
  name: string;
  title?: string;
  institution?: string;
  publicationCount: number;
  citationCount: number;
  profileUrl?: string;
}

export default function ResearchPassport({
  openalexId,
  name,
  title,
  institution,
  publicationCount,
  citationCount,
  profileUrl
}: ResearchPassportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const qrCodeUrl = `/api/researcher/${openalexId}/qr-code?url=${encodeURIComponent(profileUrl || window.location.href)}`;

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const width = 400;
      const height = 500;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = '#0B1F3A';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.arc(width + 50, -50, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-50, height + 50, 150, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      
      const displayName = name.length > 25 ? name.substring(0, 22) + '...' : name;
      ctx.fillText(displayName, width / 2, 50);

      if (title) {
        ctx.font = '14px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const displayTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
        ctx.fillText(displayTitle, width / 2, 75);
      }

      if (institution) {
        ctx.font = '12px Inter, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        const displayInst = institution.length > 40 ? institution.substring(0, 37) + '...' : institution;
        ctx.fillText(displayInst, width / 2, 95);
      }

      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => {
          const qrSize = 150;
          const qrX = (width - qrSize) / 2;
          const qrY = 120;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
          ctx.fill();
          
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = reject;
        qrImg.src = qrCodeUrl;
      });

      const statsY = 310;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(30, statsY, 160, 70, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(210, statsY, 160, 70, 8);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#F2994A';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText(publicationCount.toLocaleString(), 110, statsY + 35);
      ctx.fillText(citationCount.toLocaleString(), 290, statsY + 35);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('Publications', 110, statsY + 55);
      ctx.fillText('Citations', 290, statsY + 55);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('Scan to view full research profile', width / 2, 420);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '10px Inter, system-ui, sans-serif';
      ctx.fillText('scholar.name', width / 2, height - 20);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${name.replace(/\s+/g, '-').toLowerCase()}-research-passport.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Download complete",
        description: "Your Research Passport has been saved",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors text-sm font-medium text-white"
          data-testid="button-research-passport"
        >
          <QrCode className="w-3.5 h-3.5" />
          Passport
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Research Passport
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4">
          <div 
            ref={cardRef}
            className="w-full max-w-[320px] rounded-xl overflow-hidden shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0B1F3A 0%, #1a365d 100%)' }}
          >
            <div className="p-6 text-center text-white">
              <h3 className="text-xl font-bold mb-1 truncate">{name}</h3>
              {title && (
                <p className="text-sm text-white/80 mb-1 truncate">{title}</p>
              )}
              {institution && (
                <p className="text-xs text-white/60 truncate">{institution}</p>
              )}
            </div>
            
            <div className="flex justify-center pb-4">
              <div className="bg-white p-3 rounded-xl">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-32 h-32"
                  loading="lazy"
                  data-testid="img-passport-qr"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 px-6 pb-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BookOpen className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{publicationCount.toLocaleString()}</p>
                <p className="text-xs text-white/70">Publications</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Quote className="w-3 h-3 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-amber-400">{citationCount.toLocaleString()}</p>
                <p className="text-xs text-white/70">Citations</p>
              </div>
            </div>
            
            <div className="text-center pb-4">
              <p className="text-xs text-white/50">Scan to view full profile</p>
            </div>
            
            <div className="bg-white/5 py-2 text-center">
              <p className="text-xs text-white/40">scholar.name</p>
            </div>
          </div>
          
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full max-w-[320px] gap-2"
            data-testid="button-download-passport"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Generating...' : 'Download Passport'}
          </Button>
          
          <p className="text-xs text-muted-foreground text-center max-w-[280px]">
            Use this card at conferences, on business cards, or in email signatures. 
            Scan the QR code to view the full research profile.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
