import { Phone, MapPin, Flag, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTypeMeta, type ServiceType } from "@/lib/serviceTypes";
import { useState } from "react";
import { ReportDialog } from "./ReportDialog";

export type ServiceRow = {
  id: string;
  name: string;
  type: ServiceType;
  address: string | null;
  phone: string | null;
  latitude: number | null;
  longitude: number | null;
  city?: { name: string; district?: { name: string } | null } | null;
};

export const ServiceCard = ({ service }: { service: ServiceRow }) => {
  const meta = getTypeMeta(service.type);
  const [reportOpen, setReportOpen] = useState(false);
  const mapsUrl = service.latitude && service.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${service.latitude},${service.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${service.name} ${service.address ?? ''} Bangladesh`)}`;

  return (
    <>
      <Card className="bg-card-soft p-5 shadow-card hover:shadow-elegant transition-smooth group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: `hsl(var(--${meta.color}))` }} />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg grid place-items-center text-lg shrink-0"
              style={{ backgroundColor: `hsl(var(--${meta.color}) / 0.12)` }}>
              {meta.emoji}
            </div>
            <div className="min-w-0">
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: `hsl(var(--${meta.color}))`, backgroundColor: `hsl(var(--${meta.color}) / 0.08)` }}>
                {meta.label}
              </Badge>
              <h3 className="font-semibold text-foreground leading-tight text-balance">{service.name}</h3>
            </div>
          </div>
        </div>

        {service.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="text-balance">{service.address}</span>
          </div>
        )}
        {service.city && (
          <div className="text-xs text-muted-foreground/80 ml-6 mb-3">
            {service.city.name}{service.city.district ? `, ${service.city.district.name}` : ''}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
          {service.phone && (
            <Button asChild size="sm" variant="default" className="flex-1 min-w-[120px]">
              <a href={`tel:${service.phone}`}>
                <Phone className="w-4 h-4" />
                Call {service.phone}
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <a href={mapsUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="w-4 h-4" /> Maps
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReportOpen(true)}>
            <Flag className="w-4 h-4" /> Report
          </Button>
        </div>
      </Card>
      <ReportDialog open={reportOpen} onOpenChange={setReportOpen} serviceId={service.id} serviceName={service.name} />
    </>
  );
};
