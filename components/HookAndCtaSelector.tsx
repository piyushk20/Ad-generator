import React, { useState } from 'react';
import { AdConcept, HookAndCtaSet } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface HookAndCtaSelectorProps {
  concepts: AdConcept[];
  hooksAndCtas: HookAndCtaSet[];
  onConfirm: (finalConcepts: AdConcept[]) => void;
  isLoading: boolean;
  advertType: 'still' | 'video' | null;
}

const HookAndCtaSelector: React.FC<HookAndCtaSelectorProps> = ({ concepts, hooksAndCtas, onConfirm, isLoading, advertType }) => {
  
  const getInitialState = (index: number, type: 'hook' | 'cta') => {
      const copySet = hooksAndCtas[index];
      const concept = concepts[index];

      if (type === 'hook') {
          return copySet?.hooks?.[0] ?? concept.hookLine;
      }
      return copySet?.ctas?.[0] ?? concept.cta;
  }

  const [selectedHooks, setSelectedHooks] = useState<Record<string, string>>(() => ({
    [concepts[0].optionName]: getInitialState(0, 'hook'),
    [concepts[1].optionName]: getInitialState(1, 'hook'),
  }));
  
  const [selectedCtas, setSelectedCtas] = useState<Record<string, string>>(() => ({
    [concepts[0].optionName]: getInitialState(0, 'cta'),
    [concepts[1].optionName]: getInitialState(1, 'cta'),
  }));

  const handleConfirm = () => {
    if (isLoading) return;
    const finalConcepts = concepts.map(concept => ({
      ...concept,
      hookLine: selectedHooks[concept.optionName],
      cta: selectedCtas[concept.optionName],
    }));
    onConfirm(finalConcepts);
  };

  const buttonText = advertType === 'still' 
    ? 'Generate Final Image Prompts' 
    : 'Generate Final Video Scripts';

  return (
    <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8 animate-fade-in">
        <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
            Select Your Final Copy
            </h2>
            <p className="text-gray-400 mt-2">
            Choose the best hook and CTA for each of your concepts. This copy will be embedded in the final output.
            </p>
        </div>

        <div className="space-y-8">
            {concepts.map((concept, index) => (
                <div key={concept.optionName} className="bg-gray-900/50 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-white mb-4">{concept.optionName}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Hook Selector */}
                        <div>
                            <label htmlFor={`hook-${concept.optionName}`} className="block text-sm font-medium text-gray-300 mb-2">
                                ⚡️ Punchy Hook
                            </label>
                            <select
                                id={`hook-${concept.optionName}`}
                                value={selectedHooks[concept.optionName]}
                                onChange={(e) => setSelectedHooks(prev => ({...prev, [concept.optionName]: e.target.value}))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                            >
                                {hooksAndCtas[index]?.hooks.map((hook, i) => <option key={`hook-${index}-${i}`} value={hook}>{hook}</option>)}
                            </select>
                        </div>
                        {/* CTA Selector */}
                        <div>
                            <label htmlFor={`cta-${concept.optionName}`} className="block text-sm font-medium text-gray-300 mb-2">
                                🎯 High-Impact CTA
                            </label>
                            <select
                                id={`cta-${concept.optionName}`}
                                value={selectedCtas[concept.optionName]}
                                onChange={(e) => setSelectedCtas(prev => ({...prev, [concept.optionName]: e.target.value}))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                            >
                                {hooksAndCtas[index]?.ctas.map((cta, i) => <option key={`cta-${index}-${i}`} value={cta}>{cta}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="w-full flex justify-center items-center bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
            {isLoading ? <LoadingSpinner text="Generating Final Outputs..." /> : buttonText}
        </button>
    </div>
  );
};

export default HookAndCtaSelector;
