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
  // Proportional sizing calibrated to the master 1544 x 176 brand graphic (aspect ratio 8.77:1)
  const pixelHeights = {
    sm: 28,
    md: 34,
    lg: 38,
    xl: 42,
    "2xl": 48,
  };

  const heightClasses = {
    sm: "h-7",
    md: "h-8 sm:h-8.5",
    lg: "h-9 sm:h-9.5",
    xl: "h-9.5 sm:h-10.5",
    "2xl": "h-11 sm:h-12",
  };

  const currentHeight = pixelHeights[size] || 34;
  const currentWidth = Math.round((currentHeight * 1544) / 176);

  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      {/* Official Master RaamBow TechSolutions Brand Logo */}
      <img
        src="/raambow-logo-transparent.png"
        alt="RaamBow TechSolutions"
        width={currentWidth}
        height={currentHeight}
        style={{
          maxHeight: `${currentHeight}px`,
          height: "auto",
          maxWidth: "100%",
          aspectRatio: "1544 / 176",
          objectFit: "contain",
          flexShrink: 0,
          display: "block",
        }}
        className={`${heightClasses[size]} w-auto object-contain shrink-0`}
        loading="eager"
      />

      {showSubtitle && (
        <span className="hidden lg:inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-[#fe8001] bg-orange-50/80 border border-orange-200/80 rounded-md px-2 py-0.5 ml-1.5 leading-tight shrink-0 whitespace-nowrap shadow-2xs">
          Client Management
        </span>
      )}
    </div>
  );
}
