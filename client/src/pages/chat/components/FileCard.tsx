import React from "react";

type FileCardProps = {
  logo: string;
  name: string;
  firstFiveLines: string;
  showFade: boolean;
};
const FileCard: React.FC<FileCardProps> = ({
  logo,
  name,
  firstFiveLines,
  showFade = false,
}) => {
  return (
    <div
      className="relative w-36 h-40 z-30 shrink-0 border-white/20 rounded-[1rem]
      bg-white/10 backdrop-blur-lg overflow-hidden border-2
      shadow-[0_4px_30px_rgba(0,0,0,0.04)]"
    >
      {/* Gradient Glow Layer */}
      <div
        className="absolute inset-0 
        bg-[radial-gradient(circle_at_center,_rgba(195,220,168,0.7)_0%,_rgba(195,220,168,0.3)_55%,_rgba(195,220,168,0.08)_100%)]
        mix-blend-soft-light opacity-85 pointer-events-none"
      />

      <div className="w-full h-full p-2 relative">
        {/* File Logo */}
        <div className="w-10 h-10 bg-white/50 p-1.5 rounded-full backdrop-blur-lg">
          <img src={logo} alt={name} className="w-full h-full" />
        </div>

        {/* File Name */}
        <p className="w-full font-semibold mt-1.5 text-[0.65rem] break-all line-clamp-1 text-ellipsis">
          {name}
        </p>

        {/* File Preview Text */}
        <p className="w-full text-[0.65rem] mt-1 line-clamp-5 break-words">
          {firstFiveLines || "No preview available"}
        </p>

        {/* Bottom Gradient Overlay */}
        {/* <div
          className="absolute bottom-0 px-4 z-20 top-25 left-0 right-0 pt-2
          backdrop-blur-lg bg-gradient-to-t from-white/30 via-white/30 to-transparent
          shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
            maskImage:
              "linear-gradient(to top, black 0%, black 45%, transparent 100%)",
          }}
        /> */}
        {showFade && (
          <div
            className="absolute bottom-0 px-4 z-20 top-25 left-0 right-0 pt-2
     backdrop-blur-lg
     bg-gradient-to-t from-white/30 via-white/20 to-transparent
     shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
            style={{
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
              maskImage:
                "linear-gradient(to top, black 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
            }}
          ></div>
        )}
      </div>
    </div>
  );
};

export default FileCard;
