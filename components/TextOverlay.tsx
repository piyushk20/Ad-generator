import React, { useState } from 'react';
import { OverlayPosition } from '../types';

interface TextOverlayProps {
  text: { productName: string; cta: string };
  position: OverlayPosition;
  onPositionChange: (position: OverlayPosition) => void;
}

const positionClasses: Record<OverlayPosition, string> = {
  'top-left': 'top-4 left-4 items-start text-left',
  'top-right': 'top-4 right-4 items-end text-right',
  'bottom-left': 'bottom-4 left-4 items-start text-left',
  'bottom-right': 'bottom-4 right-4 items-end text-right',
  'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 items-center text-center'
};

const POSITIONS: OverlayPosition[] = ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'];

const TextOverlay: React.FC<TextOverlayProps> = ({ text, position, onPositionChange }) => {
  const [showControls, setShowControls] = useState(false);

  // Don't render if there is nothing to show
  if (!text.productName && !text.cta) {
    return null;
  }

  return (
    <div
      className={`absolute ${positionClasses[position]} p-4 pointer-events-none flex flex-col`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div
        className="relative bg-black/60 backdrop-blur-sm p-3 rounded-lg shadow-2xl pointer-events-auto transition-all duration-300"
      >
        {text.productName && <h4 className="text-lg font-bold text-white">{text.productName}</h4>}
        {text.cta && <p className={`text-sm font-semibold rounded-md ${text.productName ? 'mt-1 text-gray-300' : 'text-white'}`}>{text.cta}</p>}
        
        {/* Position Controls */}
        <div 
          className={`overlay-controls absolute -top-4 -right-4 bg-gray-800/80 backdrop-blur-sm p-1 rounded-full shadow-lg border border-gray-600/50 flex items-center space-x-1 transition-opacity duration-200 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        >
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => onPositionChange(pos)}
              className={`w-4 h-4 rounded-sm transition-colors duration-200 ${position === pos ? 'bg-blue-500' : 'bg-gray-500 hover:bg-gray-400'}`}
              aria-label={`Move to ${pos}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextOverlay;