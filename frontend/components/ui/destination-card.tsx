import * as React from "react";
import { cn } from "@/lib/utils";

interface DestinationCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageUrl: string;
  location: string;
  flag: string;
  stats: string;
  href: string;
  themeColor: string;
}

const DestinationCard = React.forwardRef<HTMLDivElement, DestinationCardProps>(
  ({ className, imageUrl, location, flag, stats, href, themeColor, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          // @ts-ignore - CSS custom properties are valid
          "--theme-color": themeColor,
        } as React.CSSProperties}
        className={cn("group w-full h-full", className)}
        {...props}
      >
        <div
          className="relative block w-full h-full rounded-xl overflow-hidden shadow-lg 
                     transition-all duration-500 ease-in-out"
          aria-label={`Explore details for ${location}`}
          style={{
             boxShadow: `0 0 30px -10px hsl(var(--theme-color) / 0.5)`
          }}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Themed Gradient Overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, hsl(var(--theme-color) / 0.9), hsl(var(--theme-color) / 0.6) 30%, transparent 60%)`,
            }}
          />
          
          {/* Content */}
          <div className="relative flex flex-col justify-end h-full p-5 text-white">
            <h3 className="text-2xl font-bold tracking-tight">
              {location} <span className="text-xl ml-1">{flag}</span>
            </h3>
            <p className="text-xs text-white/80 mt-1 font-medium">{stats}</p>

            {/* Click to continue text */}
            <div className="mt-6 text-center bg-[hsl(var(--theme-color)/0.2)] backdrop-blur-md border border-[hsl(var(--theme-color)/0.3)] 
                           rounded-lg px-3 py-2">
              <span className="text-xs font-medium tracking-wide text-white/90">Click to continue</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
DestinationCard.displayName = "DestinationCard";

export { DestinationCard };
