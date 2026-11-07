import React from "react";

interface RamboowLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  showSubtitle?: boolean;
}

export function RamboowLogo({
  className = "",
  size = "md",
  showSubtitle = true,
}: RamboowLogoProps) {
  // Proportional sizing calibrated to the master emblem
  const pixelHeights = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 60,
    "2xl": 76,
  };

  const emblemClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
    xl: "h-14 sm:h-16",
    "2xl": "h-16 sm:h-20",
  };

  const textSizes = {
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
    "2xl": "text-3xl sm:text-4xl",
  };

  const subTextSizes = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-base sm:text-lg",
    xl: "text-lg sm:text-xl",
    "2xl": "text-xl sm:text-2xl",
  };

  const currentHeight = pixelHeights[size] || 40;
  const currentWidth = Math.round((currentHeight * 1006) / 742);

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* 4K Ultra-Crisp Master Emblem */}
      <img
        src="/raambow-emblem-transparent.png"
        alt="RaamBow Logo"
        width={currentWidth}
        height={currentHeight}
        style={{
          height: `${currentHeight}px`,
          maxHeight: `${currentHeight}px`,
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
        className={`${emblemClasses[size]} w-auto object-contain shrink-0`}
        loading="eager"
      />

      {/* 4K Native Vector Typography (Rendered with subpixel anti-aliasing for razor-sharp clarity) */}
      <div
        className="flex items-baseline tracking-tight whitespace-nowrap leading-none"
        style={{
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          textRendering: "optimizeLegibility",
        }}
      >
        <span
          className={`${textSizes[size]} font-black tracking-tight text-[#013687]`}
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          Raam
        </span>
        <span
          className={`${textSizes[size]} font-black tracking-tight text-[#fe8001]`}
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          Bow
        </span>
        <span
          className={`${subTextSizes[size]} font-semibold tracking-normal text-[#5d5e61] ml-1.5 sm:ml-2`}
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          TechSolutions
        </span>
      </div>

      {showSubtitle && (
        <span className="hidden sm:inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#fe8001] border-l border-slate-300 pl-2.5 ml-1 leading-none py-1">
          Client Management
        </span>
      )}
    </div>
  );
}
