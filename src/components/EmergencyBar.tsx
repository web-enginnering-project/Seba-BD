import { Phone } from "lucide-react";
import { EMERGENCY_NUMBERS } from "@/lib/serviceTypes";

export const EmergencyBar = () => {
  return (
    <div className="bg-emergency text-emergency-foreground shadow-emergency">
      <div className="container py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs font-bold uppercase tracking-wider whitespace-nowrap pr-2 border-r border-emergency-foreground/30">
          জরুরি / Emergency
        </span>
        <div className="flex gap-2">
          {EMERGENCY_NUMBERS.map((e) => (
            <a
              key={e.number}
              href={`tel:${e.number}`}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emergency-foreground/15 hover:bg-emergency-foreground/25 transition-smooth text-xs font-semibold whitespace-nowrap"
            >
              <Phone className="w-3 h-3" />
              <span>{e.name}</span>
              <span className="font-bold tabular-nums">{e.number}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
