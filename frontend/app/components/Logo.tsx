'use client';

export default function Logo({ className = "w-8 h-8", withText = false }: { className?: string, withText?: boolean }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
        {/* Abstract interconnecting shapes */}
        <path 
          d="M12 8C12 5.79086 13.7909 4 16 4H24C26.2091 4 28 5.79086 28 8V12C28 14.2091 26.2091 16 24 16H16C13.7909 16 12 14.2091 12 12V8Z" 
          fill="url(#logoGradient)" 
          fillOpacity="0.8"
        />
        <path 
          d="M4 20C4 17.7909 5.79086 16 8 16H16C18.2091 16 20 17.7909 20 20V28C20 30.2091 18.2091 32 16 32H8C5.79086 32 4 30.2091 4 28V20Z" 
          fill="#3B82F6" 
          fillOpacity="0.9"
        />
        <circle cx="28" cy="24" r="8" fill="#8B5CF6" fillOpacity="0.8" />
      </svg>
      {withText && (
        <span className="font-bold text-xl tracking-tight text-gray-900">
          Collab<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Board</span>
        </span>
      )}
    </div>
  );
}
