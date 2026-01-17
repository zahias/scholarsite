import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  targetDate: Date;
  label?: string;
  className?: string;
}

export default function CountdownTimer({ 
  targetDate, 
  label = "Founder pricing ends in",
  className = ""
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-primary/10 rounded-lg px-2 py-1 min-w-[40px]">
        <span className="text-lg md:text-xl font-bold text-primary font-mono">
          {value.toString().padStart(2, '0')}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
      </div>
      <div className="flex items-center gap-1">
        <TimeUnit value={timeLeft.days} label="Days" />
        <span className="text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <span className="text-muted-foreground font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <span className="text-muted-foreground font-bold hidden sm:inline">:</span>
        <div className="hidden sm:block">
          <TimeUnit value={timeLeft.seconds} label="Sec" />
        </div>
      </div>
    </div>
  );
}
