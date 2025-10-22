import React, { useMemo } from "react";

interface GlassCardProps {
  image: string | File; // image file or imported path
  blurStrength?: number; // how strong the glass blur is
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * 🪩 GlassCard — background image + adjustable blur.
 * Accepts an imported image, URL, or File (e.g. from user upload).
 */
const GlassCard: React.FC<GlassCardProps> = ({
  image,
  blurStrength = 16,
  children,
  className = "",
  style = {},
}) => {
  // Convert File object → URL if needed
  const backgroundUrl = useMemo(() => {
    if (typeof image === "string") return image;
    return URL.createObjectURL(image);
  }, [image]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        backgroundImage: `url(${backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {/* Glass overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: `blur(${blurStrength}px)`,
          WebkitBackdropFilter: `blur(${blurStrength}px)`,
          backgroundColor: "rgba(255,255,255,0.8)",
        }}
      />

      {/* Foreground content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: "1rem",
          color: "#fff",
          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default GlassCard;
