import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, QrCode, BookOpen, Quote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getInitials } from "./ProfilePageShell";

interface ResearchPassportProps {
  openalexId: string;
  name: string;
  title?: string;
  institution?: string;
  publicationCount: number;
  citationCount: number;
  profileUrl?: string;
  profileImageUrl?: string | null;
}

// Single source of truth for the passport's palette so the on-screen preview
// and the downloaded PNG (drawn separately on a <canvas>) can't drift apart
// the way they used to (preview used Tailwind's amber-400, the PNG used the
// brand's actual --theme-warm hex — two different colors for the same card).
const PASSPORT_THEME = {
  navyStart: "#0B1F3A", // --theme-midnight
  navyEnd: "#142850", // --theme-oxford
  gold: "#F2994A", // --theme-warm
  goldAccent: "#FFC72E",
};

function absoluteUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  return `${window.location.origin}${url}`;
}

export default function ResearchPassport({
  openalexId,
  name,
  title,
  institution,
  publicationCount,
  citationCount,
  profileUrl,
  profileImageUrl,
}: ResearchPassportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const { toast } = useToast();

  const qrCodeUrl = `/api/researcher/${openalexId}/qr-code?url=${encodeURIComponent(profileUrl || window.location.href)}`;
  const photoUrl = absoluteUrl(profileImageUrl);
  const initials = getInitials(name);

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      // Canvas falls back to a generic system font unless the webfont is
      // confirmed loaded first — this is why the downloaded card previously
      // never actually showed Newsreader even though the rest of the site does.
      await Promise.all([
        document.fonts.load("700 26px Newsreader"),
        document.fonts.load("600 14px Inter"),
        document.fonts.ready,
      ]).catch(() => undefined);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const width = 400;
      const height = 540;
      canvas.width = width;
      canvas.height = height;

      const bg = ctx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, PASSPORT_THEME.navyStart);
      bg.addColorStop(1, PASSPORT_THEME.navyEnd);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // Subtle security-pattern texture — diagonal hairlines, like a
      // watermark on an official document — so the card reads as a
      // credential rather than a plain stat tile.
      ctx.save();
      ctx.strokeStyle = "rgba(255,255,255,0.035)";
      ctx.lineWidth = 1;
      for (let x = -height; x < width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + height, height);
        ctx.stroke();
      }
      ctx.restore();

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.beginPath();
      ctx.arc(width + 50, -50, 200, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-50, height + 50, 150, 0, Math.PI * 2);
      ctx.fill();

      // Gold frame
      ctx.strokeStyle = "rgba(255, 199, 46, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(8, 8, width - 16, height - 16, 16);
      ctx.stroke();

      // Avatar — photo if available, else an initials seal
      const avatarCenterX = width / 2;
      const avatarCenterY = 62;
      const avatarRadius = 34;
      const drawInitialsAvatar = () => {
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        ctx.fillStyle = PASSPORT_THEME.goldAccent;
        ctx.fill();
        ctx.fillStyle = PASSPORT_THEME.navyStart;
        ctx.font = "700 26px Newsreader, Georgia, serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials, avatarCenterX, avatarCenterY + 2);
        ctx.textBaseline = "alphabetic";
      };

      if (photoUrl) {
        try {
          const avatarImg = new Image();
          avatarImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            avatarImg.onload = () => resolve();
            avatarImg.onerror = () => reject(new Error("avatar load failed"));
            avatarImg.src = photoUrl;
          });
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            avatarImg,
            avatarCenterX - avatarRadius,
            avatarCenterY - avatarRadius,
            avatarRadius * 2,
            avatarRadius * 2,
          );
          ctx.restore();
        } catch {
          drawInitialsAvatar();
        }
      } else {
        drawInitialsAvatar();
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 24px Newsreader, Georgia, serif";
      const displayName = name.length > 25 ? name.substring(0, 22) + "..." : name;
      ctx.fillText(displayName, width / 2, 128);

      if (title) {
        ctx.font = "600 13px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        const displayTitle = title.length > 35 ? title.substring(0, 32) + "..." : title;
        ctx.fillText(displayTitle, width / 2, 150);
      }

      if (institution) {
        ctx.font = "12px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        const displayInst = institution.length > 40 ? institution.substring(0, 37) + "..." : institution;
        ctx.fillText(displayInst, width / 2, 168);
      }

      const qrImg = new Image();
      qrImg.crossOrigin = "anonymous";

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => {
          const qrSize = 150;
          const qrX = (width - qrSize) / 2;
          const qrY = 195;

          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
          ctx.fill();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          resolve();
        };
        qrImg.onerror = reject;
        qrImg.src = qrCodeUrl;
      });

      const statsY = 385;
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(30, statsY, 160, 70, 8);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(210, statsY, 160, 70, 8);
      ctx.fill();

      ctx.textAlign = "center";
      ctx.fillStyle = PASSPORT_THEME.gold;
      ctx.font = "700 28px Newsreader, Georgia, serif";
      ctx.fillText(publicationCount.toLocaleString(), 110, statsY + 38);
      ctx.fillText(citationCount.toLocaleString(), 290, statsY + 38);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "600 11px Inter, system-ui, sans-serif";
      ctx.fillText("Publications", 110, statsY + 55);
      ctx.fillText("Citations", 290, statsY + 55);

      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "11px Inter, system-ui, sans-serif";
      ctx.fillText("Scan to view full research profile", width / 2, statsY + 100);

      ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.fillText("SCHOLAR.NAME", width / 2, height - 22);

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-research-passport.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Download complete",
        description: "Your Research Passport has been saved",
      });
    } catch (error) {
      console.error("Download error:", error);
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
        <button className="profile-tool-button" data-testid="button-research-passport">
          <QrCode />
          Passport
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif">
            <QrCode className="h-5 w-5" />
            Research Passport
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <div
            className="relative w-full max-w-[320px] rounded-2xl overflow-hidden shadow-2xl border"
            style={{
              background: `linear-gradient(135deg, ${PASSPORT_THEME.navyStart} 0%, ${PASSPORT_THEME.navyEnd} 100%)`,
              borderColor: "rgba(255, 199, 46, 0.35)",
            }}
          >
            {/* Security-pattern texture, matching the downloaded PNG */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 1px, transparent 11px)",
              }}
            />

            <div className="relative pt-6 pb-2 text-center text-white">
              <div className="flex justify-center mb-3">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={`${name} profile`}
                    className="w-16 h-16 rounded-full object-cover ring-2"
                    style={{ ["--tw-ring-color" as string]: PASSPORT_THEME.goldAccent }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center font-serif text-xl font-bold"
                    style={{ background: PASSPORT_THEME.goldAccent, color: PASSPORT_THEME.navyStart }}
                  >
                    {initials}
                  </div>
                )}
              </div>
              <h3 className="font-serif text-xl font-bold mb-1 truncate px-6">{name}</h3>
              {title && <p className="text-sm text-white/80 mb-1 truncate px-6">{title}</p>}
              {institution && <p className="text-xs text-white/60 truncate px-6">{institution}</p>}
            </div>

            <div className="relative flex justify-center py-4">
              <div className="bg-white p-3 rounded-xl relative">
                {!qrLoaded && <Skeleton className="w-32 h-32 rounded-lg absolute inset-3" />}
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-32 h-32"
                  style={{ opacity: qrLoaded ? 1 : 0 }}
                  onLoad={() => setQrLoaded(true)}
                  data-testid="img-passport-qr"
                />
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-3 px-6 pb-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BookOpen className="w-3 h-3" style={{ color: PASSPORT_THEME.gold }} />
                </div>
                <p className="font-serif text-2xl font-bold" style={{ color: PASSPORT_THEME.gold }}>
                  {publicationCount.toLocaleString()}
                </p>
                <p className="text-xs text-white/70">Publications</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Quote className="w-3 h-3" style={{ color: PASSPORT_THEME.gold }} />
                </div>
                <p className="font-serif text-2xl font-bold" style={{ color: PASSPORT_THEME.gold }}>
                  {citationCount.toLocaleString()}
                </p>
                <p className="text-xs text-white/70">Citations</p>
              </div>
            </div>

            <div className="relative text-center pb-4">
              <p className="text-xs text-white/50">Scan to view full profile</p>
            </div>

            <div className="relative bg-white/5 py-2 text-center">
              <p className="text-xs tracking-[.15em] text-white/40">SCHOLAR.NAME</p>
            </div>
          </div>

          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full max-w-[320px] gap-2"
            data-testid="button-download-passport"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? "Generating..." : "Download Passport"}
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
