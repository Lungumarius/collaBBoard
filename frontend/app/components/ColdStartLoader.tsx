'use client';

import { useState, useEffect } from 'react';

const MESSAGES = [
  "Connecting to secure server...",
  "Waking up the cloud instance (this might take a moment)...",
  "Preparing your workspace...",
  "Loading collaboration tools...",
  "Almost there...",
  "Finalizing secure connection..."
];

export default function ColdStartLoader() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-fadeIn">
      {/* Modern Spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
      
      {/* Rotating Text */}
      <div className="h-8 flex items-center justify-center">
        <p className="text-gray-600 font-medium text-center animate-pulse transition-all duration-500">
          {MESSAGES[messageIndex]}
        </p>
      </div>

      <div className="text-xs text-gray-400 max-w-xs text-center">
        Running on eco-friendly cloud infrastructure. 
        <br/>First load may take up to 30s.
      </div>
    </div>
  );
}
