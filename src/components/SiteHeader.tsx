import { Link, useRouterState } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export const SiteHeader = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const linkCls = (active: boolean) =>
    cn(
      "px-3 py-2 rounded-lg font-medium transition-smooth",
      active ? "text-primary bg-accent" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-hero grid place-items-center shadow-elegant group-hover:scale-105 transition-smooth">
            <Shield className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-foreground">SebaBD</div>
            <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Bangladesh Service Directory
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/" className={linkCls(isActive("/", true))}>Directory</Link>
          <Link to="/admin" className={linkCls(isActive("/admin"))}>Admin</Link>
        </nav>
      </div>
    </header>
  );
};
