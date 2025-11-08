import React, { useState } from 'react';
import { AdConcept } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ConceptEditorProps {
  concept: AdConcept;
  onEdit: (field: string, value: string) => void;
  onEnhanceStyling: () => void;
  isEnhancingStyling: boolean;
}

const EditableField: React.FC<{ 
    label: string; 
    fieldName: string; 
    value: string; 
    onEdit: (field: string, value: string) => void; 
    rows?: number, 
    children?: React.ReactNode,
    isInput?: boolean 
}> = ({ label, fieldName, value, onEdit, rows = 3, children, isInput = false }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-300">
                {label}
            </label>
            {children}
        </div>
        {isInput ? (
            <input
                type="text"
                id={fieldName}
                value={value}
                onChange={(e) => onEdit(fieldName, e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
            />
        ) : (
            <textarea
                id={fieldName}
                value={value}
                onChange={(e) => onEdit(fieldName, e.target.value)}
                rows={rows}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
            />
        )}
    </div>
);

const ConceptEditor: React.FC<ConceptEditorProps> = ({ concept, onEdit, onEnhanceStyling, isEnhancingStyling }) => {
  const isVideo = concept.format === 'Short Video';
  const [areSpecsVisible, setAreSpecsVisible] = useState(false);

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg p-6 mt-4 border-t-2 border-blue-500">
      <h3 className="text-xl font-bold text-white mb-6">
        ✏️ Make Changes
      </h3>
      <div className="space-y-6">
        <EditableField label="Concept Summary" fieldName="conceptSummary" value={concept.conceptSummary} onEdit={onEdit} />
        <EditableField label="Ad Copy" fieldName="adCopy" value={concept.adCopy} onEdit={onEdit} rows={4} />
        <EditableField label={isVideo ? "Scene Description" : "Shoot Setup Details"} fieldName="shootSetup" value={concept.shootSetup} onEdit={onEdit} />
        <EditableField label="Styling Notes" fieldName="stylingNotes" value={concept.stylingNotes} onEdit={onEdit}>
            <button 
                onClick={onEnhanceStyling} 
                disabled={isEnhancingStyling}
                className="flex items-center text-xs bg-purple-600/50 hover:bg-purple-600/80 text-white font-semibold py-1 px-3 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isEnhancingStyling ? <LoadingSpinner text="Enhancing..."/> : '✨ Enhance'}
            </button>
        </EditableField>
        <EditableField label="Post-Production Notes" fieldName="postProduction" value={concept.postProduction} onEdit={onEdit} />
        <EditableField label="Trend Reasoning" fieldName="trendReasoning" value={concept.trendReasoning} onEdit={onEdit} />
        
        <div className="pt-4 border-t border-gray-700">
             <button
                onClick={() => setAreSpecsVisible(!areSpecsVisible)}
                className="w-full flex justify-between items-center text-left py-2 focus:outline-none group"
            >
                <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">⚙️ Technical Specs</h4>
                 <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">{areSpecsVisible ? 'Hide' : 'Edit'}</span>
                    <svg
                        className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 group-hover:text-white ${areSpecsVisible ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                 </div>
            </button>
        </div>

        {areSpecsVisible && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <EditableField label="Mood / Effect" fieldName="technicalSpecs.mood" value={concept.technicalSpecs.mood} onEdit={onEdit} isInput />
                <EditableField label="Camera" fieldName="technicalSpecs.camera" value={concept.technicalSpecs.camera} onEdit={onEdit} isInput />
                <EditableField label={isVideo ? "Lens Style" : "Lenses"} fieldName="technicalSpecs.lenses" value={concept.technicalSpecs.lenses} onEdit={onEdit} isInput />
                <EditableField label={isVideo ? "Key Shots / Angles" : "Angles"} fieldName="technicalSpecs.angles" value={concept.technicalSpecs.angles} onEdit={onEdit} isInput />
                <EditableField label={isVideo ? "Resolution / Framerate" : "Image Specs"} fieldName="technicalSpecs.specs" value={concept.technicalSpecs.specs} onEdit={onEdit} isInput />
                {isVideo && (
                    <>
                        <EditableField label="Camera Movement" fieldName="technicalSpecs.cameraMovement" value={concept.technicalSpecs.cameraMovement || ''} onEdit={onEdit} isInput />
                        <EditableField label="Editing Style" fieldName="technicalSpecs.editingStyle" value={concept.technicalSpecs.editingStyle || ''} onEdit={onEdit} isInput />
                        <EditableField label="Sound Design" fieldName="technicalSpecs.soundDesign" value={concept.technicalSpecs.soundDesign || ''} onEdit={onEdit} isInput />
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ConceptEditor;
