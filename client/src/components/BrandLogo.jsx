// Shared brand logo component — used in Navbar, Sidebar, Auth pages, etc.
// size: "sm" = 36px, "md" = 44px (default), "lg" = 60px, "xl" = 88px
const SIZES = {
  sm: { img: "w-9 h-9",   text: "text-base" },
  md: { img: "w-11 h-11", text: "text-lg" },
  lg: { img: "w-16 h-16", text: "text-xl" },
  xl: { img: "w-22 h-22", text: "text-2xl" },
};

export default function BrandLogo({ size = "md", showText = true, className = "" }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/avantika-eduai-logo.png"
        alt="Avantika EduAI Logo"
        className={`${s.img} object-contain flex-shrink-0`}
      />
      {showText && (
        <span className={`font-bold text-gray-900 ${s.text} leading-tight`}>
          Avantika <span className="text-purple-700">EduAI</span>
        </span>
      )}
    </div>
  );
}
