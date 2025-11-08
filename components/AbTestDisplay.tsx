import React from 'react';
import { AbTestVariation } from '../types';

interface AbTestDisplayProps {
  variations: AbTestVariation[];
}

const AbTestDisplay: React.FC<AbTestDisplayProps> = ({ variations }) => {
  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 space-y-6">
      <h3 className="text-center text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
        🧪 A/B Testing Suggestions
      </h3>
      <p className="text-center text-sm text-gray-400 -mt-4">
        Test these simple variations against your main concepts to optimize performance.
      </p>
      <div className="space-y-8">
        {variations.map((conceptVariation, index) => (
          <div key={index} className="bg-gray-900/50 p-4 rounded-lg">
            <h4 className="font-semibold text-lg text-white mb-4">{conceptVariation.conceptName}</h4>
            <div className="space-y-4">
              {conceptVariation.variations.map((variation, vIndex) => (
                <div key={vIndex} className="border-t border-gray-700 pt-4">
                  <p className="font-semibold text-blue-400">{variation.title}</p>
                  <p className="text-sm text-gray-400 mt-1">{variation.description}</p>
                  <div className="mt-2 bg-gray-800 p-3 rounded-md">
                    <p className="text-sm text-white font-mono whitespace-pre-wrap">{variation.suggestion}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbTestDisplay;
