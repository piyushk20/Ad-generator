import React from 'react';

const Tooltip: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="group relative flex items-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 cursor-help text-gray-500 transition-colors group-hover:text-blue-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="absolute bottom-full z-10 mb-2 w-64 max-w-xs -translate-x-1/2 transform rounded-lg bg-gray-700 p-3 text-left text-xs text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 left-1/2 pointer-events-none">
        {text}
        <svg
          className="absolute top-full h-2 w-full text-gray-700 left-0"
          x="0px"
          y="0px"
          viewBox="0 0 255 255"
        >
          <polygon className="fill-current" points="0,0 127.5,127.5 255,0" />
        </svg>
      </div>
    </div>
  );
};

export default Tooltip;
