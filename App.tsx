import React, { useState, useCallback, useEffect } from 'react';
import { AdConcept, ConceptIdea, HookAndCtaSet, ImageGenPrompt, VideoScript, AdvertStyle, AbTestVariation, OverlayPosition } from './types';
import { generateAdvertStyles, generateConceptIdeas, generateFullConcepts, generateHooksAndCtas, generateImagePrompts, generateVideoScripts, enhanceStylingNotes, generateAbTestVariations } from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import AdConceptCard from './components/AdConceptCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import ConceptIdeaSelector from './components/ConceptIdeaSelector';
import ConceptEditor from './components/ConceptEditor';
import { fileToGenerativePart } from './utils/fileUtils';
import AdvertTypeSelector from './components/AdvertTypeSelector';
import ImageGenPromptDisplay from './components/ImageGenPromptDisplay';
import VideoScriptDisplay from './components/VideoScriptDisplay';
import AdvertStyleSelector from './components/AdvertStyleSelector';
import HookAndCtaSelector from './components/HookAndCtaSelector';
import Tooltip from './components/Tooltip';
import ProgressStepper from './components/ProgressStepper';
import AbTestDisplay from './components/AbTestDisplay';

type Stage = 
  'initial' | 
  'imageUploaded' |
  'generatingStyles' |
  'stylesGenerated' |
  'generatingIdeas' | 
  'ideasGenerated' | 
  'generatingFullConcepts' | 
  'reviewingConcepts' |
  'generatingHooksAndCtasForSelection' |
  'selectingHooksAndCtas' |
  'generatingFinalOutputs' |
  'finalOutputsGenerated';

const App: React.FC = () => {
  const [stage, setStage] = useState<Stage>('initial');
  
  // Inputs
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [advertType, setAdvertType] = useState<'still' | 'video' | null>(null);
  const [ctaUrl, setCtaUrl] = useState<string>('');
  const [ctaWhatsApp, setCtaWhatsApp] = useState<string>('');
  const [priceTag, setPriceTag] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [brandGuidelines, setBrandGuidelines] = useState<string>('');
  const [userConcept, setUserConcept] = useState<string>('');
  const [copyLanguages, setCopyLanguages] = useState<string[]>(['English', 'English']);
  
  // AI-Generated Content
  const [advertStyles, setAdvertStyles] = useState<AdvertStyle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<AdvertStyle | null>(null);
  const [conceptIdeas, setConceptIdeas] = useState<ConceptIdea[]>([]);
  const [adConcepts, setAdConcepts] = useState<AdConcept[]>([]);
  const [editableConcepts, setEditableConcepts] = useState<AdConcept[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [hooksAndCtasForSelection, setHooksAndCtasForSelection] = useState<HookAndCtaSet[] | null>(null);
  const [imageGenPrompts, setImageGenPrompts] = useState<ImageGenPrompt[] | null>(null);
  const [videoScripts, setVideoScripts] = useState<VideoScript[] | null>(null);
  const [abTestVariations, setAbTestVariations] = useState<AbTestVariation[] | null>(null);
  
  // State
  const [error, setError] = useState<string | null>(null);
  const [isEnhancingStyling, setIsEnhancingStyling] = useState<boolean>(false);
  const [isGeneratingAbTests, setIsGeneratingAbTests] = useState<boolean>(false);
  const [overlayPosition, setOverlayPosition] = useState<OverlayPosition>('bottom-left');


  const resetWorkflow = (keepImage: boolean = false) => {
    setStage(keepImage ? 'imageUploaded' : 'initial');
    if (!keepImage) {
        setImageFile(null);
        setImageUrl(null);
    }
    setError(null);
    setAdvertType(null);
    setAdvertStyles([]);
    setSelectedStyle(null);
    setConceptIdeas([]);
    setAdConcepts([]);
    setEditableConcepts([]);
    setReviewIndex(0);
    setHooksAndCtasForSelection(null);
    setImageGenPrompts(null);
    setVideoScripts(null);
    setAbTestVariations(null);
    setIsGeneratingAbTests(false);
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    resetWorkflow(true);
    setStage('imageUploaded');
  };

  const handleAdvertTypeSelect = useCallback(async (type: 'still' | 'video') => {
    if (!imageFile) {
        setError("Image not found. Please start over by re-uploading.");
        resetWorkflow(false);
        return;
    }

    setAdvertType(type);
    if (type === 'video') {
        setPriceTag('');
    }
    
    setStage('generatingStyles');
    setError(null);

    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const styles = await generateAdvertStyles(imagePart, type);
        setAdvertStyles(styles);
        setStage('stylesGenerated');
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
        setStage('imageUploaded'); // Go back to type selection if style generation fails
    }
  }, [imageFile]);


  const handleGenerateIdeas = useCallback(async () => {
    if (!imageFile || !selectedStyle || !advertType) {
      setError('Please ensure an image, advert type, and a trending style are selected.');
      return;
    }
    setStage('generatingIdeas');
    setError(null);
    setConceptIdeas([]);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const ideas = await generateConceptIdeas(imagePart, { url: ctaUrl, whatsapp: ctaWhatsApp }, brandGuidelines, userConcept, selectedStyle, advertType);
      
      if (ideas && ideas.length > 0) {
        setConceptIdeas(ideas);
        setStage('ideasGenerated');
      } else {
        setError("The AI couldn't generate any ideas for this combination. Please try adjusting your inputs.");
        setStage('stylesGenerated');
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
      setStage('stylesGenerated');
    }
  }, [imageFile, ctaUrl, ctaWhatsApp, brandGuidelines, userConcept, selectedStyle, advertType]);

  const handleGenerateFullConcepts = useCallback(async (selectedIdeas: ConceptIdea[]) => {
    if (!imageFile || !advertType || selectedIdeas.length !== 2) {
        setError("Something went wrong. Please start over.");
        return;
    }
    setStage('generatingFullConcepts');
    setError(null);
    setAdConcepts([]);
    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const concepts = await generateFullConcepts(imagePart, { url: ctaUrl, whatsapp: ctaWhatsApp }, brandGuidelines, userConcept, selectedIdeas, advertType, selectedStyle!);
        setAdConcepts(concepts);
        setEditableConcepts(JSON.parse(JSON.stringify(concepts))); // Deep copy for editing
        setReviewIndex(0);
        setStage('reviewingConcepts');
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
        setStage('ideasGenerated');
    }
  }, [imageFile, ctaUrl, ctaWhatsApp, brandGuidelines, userConcept, advertType, selectedStyle]);

  const handleConceptEdit = useCallback((field: string, value: string) => {
    setEditableConcepts(prev => {
        const newConcepts = JSON.parse(JSON.stringify(prev));
        const conceptToEdit = newConcepts[reviewIndex];
        
        const fields = field.split('.');
        let currentLevel: any = conceptToEdit;
        for (let i = 0; i < fields.length - 1; i++) {
            if (currentLevel[fields[i]] === undefined) {
                currentLevel[fields[i]] = {};
            }
            currentLevel = currentLevel[fields[i]];
        }
        currentLevel[fields[fields.length - 1]] = value;

        return newConcepts;
    });
  }, [reviewIndex]);

  const handleEnhanceStyling = useCallback(async () => {
    const conceptToEnhance = editableConcepts[reviewIndex];
    if (!conceptToEnhance) return;
    setIsEnhancingStyling(true);
    setError(null);
    try {
        const newStylingNotes = await enhanceStylingNotes(conceptToEnhance);
        handleConceptEdit('stylingNotes', newStylingNotes);
    } catch (err) {
        console.error(err);
        setError(err instanceof Error ? `Failed to enhance styling: ${err.message}` : 'An unknown error occurred during enhancement.');
    } finally {
        setIsEnhancingStyling(false);
    }
  }, [editableConcepts, reviewIndex, handleConceptEdit]);

  const handleGenerateHooksAndCtasForSelection = useCallback(async () => {
    if (!imageFile || editableConcepts.length === 0) return;
    setAdConcepts(editableConcepts); // Lock in the edits
    setStage('generatingHooksAndCtasForSelection');
    setError(null);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      const hooksResult = await generateHooksAndCtas(imagePart, editableConcepts, { url: ctaUrl, whatsapp: ctaWhatsApp }, copyLanguages as [string, string]);
      setHooksAndCtasForSelection(hooksResult);
      setStage('selectingHooksAndCtas');
    } catch (err) {
       console.error(err);
       setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
       setStage('reviewingConcepts'); // Go back to editor on failure
    }
  }, [imageFile, editableConcepts, ctaUrl, ctaWhatsApp, copyLanguages]);

  const handleFinalizeAndGenerateOutputs = useCallback(async (conceptsWithSelectedCopy: AdConcept[]) => {
    if (!imageFile || !advertType || conceptsWithSelectedCopy.length === 0) return;
    setAdConcepts(conceptsWithSelectedCopy); // Lock in final concepts with selected copy
    setStage('generatingFinalOutputs');
    setError(null);
    setAbTestVariations(null); // Clear previous variations
    try {
      const imagePart = await fileToGenerativePart(imageFile);

      if (advertType === 'still') {
        const prompts = await generateImagePrompts(imagePart, conceptsWithSelectedCopy, priceTag);
        setImageGenPrompts(prompts);
      } else {
        const scripts = await generateVideoScripts(imagePart, conceptsWithSelectedCopy, brandName);
        setVideoScripts(scripts);
      }
      setStage('finalOutputsGenerated');

      // Now, generate A/B test variations in the background
      setIsGeneratingAbTests(true);
      try {
          const variations = await generateAbTestVariations(conceptsWithSelectedCopy);
          setAbTestVariations(variations);
      } catch (abTestErr) {
          console.error("Failed to generate A/B test variations:", abTestErr);
          // Don't show an error to the user, it's a non-critical feature.
      } finally {
          setIsGeneratingAbTests(false);
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
      setStage('selectingHooksAndCtas'); 
    }
  }, [imageFile, advertType, priceTag, brandName]);
  
  const conceptSelectorTitle = userConcept 
    ? "AI-Enhanced Concepts" 
    : "Choose Your Favorite Concepts";
  const conceptSelectorSubtitle = userConcept
    ? "We've enhanced your idea with trending, high-CTR strategies. Select your two favorite variations to build out."
    : "Select your two favorite high-level concepts to develop into full photoshoot plans.";

  const languageOptions = [
    { value: 'English', label: 'English' },
    { value: 'Hindi', label: 'Hindi' },
    { value: 'Bengali', label: 'Bengali' },
    { value: 'Tamil', label: 'Tamil' },
    { value: 'Telugu', label: 'Telugu' },
    { value: 'Marathi', label: 'Marathi' }
  ];

  const getCurrentProgressStage = (): number => {
    switch(stage) {
      case 'initial':
      case 'imageUploaded':
      case 'generatingStyles':
      case 'stylesGenerated':
        return 1; // Setup
      case 'generatingIdeas':
      case 'ideasGenerated':
      case 'generatingFullConcepts':
        return 2; // Ideation
      case 'reviewingConcepts':
      case 'generatingHooksAndCtasForSelection':
      case 'selectingHooksAndCtas':
        return 3; // Refinement
      case 'generatingFinalOutputs':
      case 'finalOutputsGenerated':
        return 4; // Final Output
      default:
        return 0;
    }
  };

  const currentConceptForOverlay = (stage === 'reviewingConcepts' || stage === 'generatingHooksAndCtasForSelection') && editableConcepts.length > reviewIndex 
    ? editableConcepts[reviewIndex] 
    : null;

  const overlayText = currentConceptForOverlay && (brandName || currentConceptForOverlay.cta)
      ? {
          productName: brandName,
          cta: currentConceptForOverlay.cta
        }
      : null;


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">

        {stage !== 'initial' && (
            <div className="mb-8">
                <ProgressStepper currentStage={getCurrentProgressStage()} />
            </div>
        )}

        <div className="bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-8">
            
            {stage === 'initial' && (
                <div className="text-center animate-fade-in">
                    <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                    Create High-Converting Ad Concepts
                    </h2>
                    <p className="text-gray-400 mt-2">
                    Start by uploading your product image.
                    </p>
                </div>
            )}
            
            <ImageUploader 
              onImageUpload={handleImageUpload} 
              imageUrl={imageUrl} 
              onError={setError}
              overlayText={overlayText}
              overlayPosition={overlayPosition}
              onOverlayPositionChange={setOverlayPosition}
            />
            
            {stage === 'imageUploaded' && (
                <AdvertTypeSelector onSelect={handleAdvertTypeSelect} />
            )}

            {stage === 'generatingStyles' && <LoadingSpinner text="Analyzing Trends..." />}

            {stage === 'stylesGenerated' && (
                <AdvertStyleSelector styles={advertStyles} onSelect={setSelectedStyle} selectedStyle={selectedStyle} />
            )}

            {selectedStyle && (stage === 'stylesGenerated' || stage === 'generatingIdeas' || stage === 'ideasGenerated') && (
                 <div className="mt-8 pt-8 border-t border-gray-700 space-y-4 animate-fade-in">
                    {/* CTA Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label htmlFor="ctaUrl" className="flex items-center space-x-1.5 text-sm font-medium text-gray-300">
                                <span>CTA Target Website/URL (Optional)</span>
                                <Tooltip text="Provide the full URL for your landing page or product page. The AI will use this to create a specific 'Shop Now' or 'Learn More' call to action." />
                            </label>
                            <input
                                type="text"
                                id="ctaUrl"
                                value={ctaUrl}
                                onChange={(e) => setCtaUrl(e.target.value)}
                                disabled={stage === 'generatingIdeas'}
                                className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="https://yourbrand.com/product"
                            />
                        </div>
                         <div>
                            <label htmlFor="ctaWhatsApp" className="flex items-center space-x-1.5 text-sm font-medium text-gray-300">
                                <span>CTA Target WhatsApp Number (Optional)</span>
                                <Tooltip text="Enter a WhatsApp number (including country code) to generate 'Message Us' or 'Chat on WhatsApp' calls to action." />
                            </label>
                            <input
                                type="text"
                                id="ctaWhatsApp"
                                value={ctaWhatsApp}
                                onChange={(e) => setCtaWhatsApp(e.target.value)}
                                disabled={stage === 'generatingIdeas'}
                                className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="+1234567890"
                            />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="priceTag" className="block text-sm font-medium text-gray-300">Price Tag Sticker (Optional)</label>
                            <input
                                type="text"
                                id="priceTag"
                                value={priceTag}
                                onChange={(e) => setPriceTag(e.target.value)}
                                disabled={stage === 'generatingIdeas' || advertType !== 'still'}
                                className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                                placeholder="e.g., $99.99 or 25% OFF"
                            />
                        </div>
                         <div>
                            <label htmlFor="brandName" className="block text-sm font-medium text-gray-300">Brand Name (Optional)</label>
                            <input
                                type="text"
                                id="brandName"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                disabled={stage === 'generatingIdeas'}
                                className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., YourBrand"
                            />
                        </div>
                    </div>
                    {/* Brand Guidelines */}
                    <div>
                        <label htmlFor="brandGuidelines" className="flex items-center space-x-1.5 text-sm font-medium text-gray-300">
                            <span>Brand Guidelines (Optional)</span>
                            <Tooltip text="Guide the AI's tone and style. Include your brand's personality (e.g., playful, luxurious), key colors, fonts, and things to avoid (e.g., 'no humor', 'avoid red color'). The more detail, the better!" />
                        </label>
                        <textarea
                            id="brandGuidelines"
                            value={brandGuidelines}
                            onChange={(e) => setBrandGuidelines(e.target.value)}
                            disabled={stage === 'generatingIdeas'}
                            rows={3}
                            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="e.g., Tone: playful, energetic. Colors: vibrant blues and yellows. Keywords: innovative, fast, simple."
                        />
                         <div className="mt-2 text-xs text-gray-500 space-y-1">
                            <p><strong>Examples:</strong></p>
                            <p>• <span className="font-semibold">Tone & Colors:</span> "Our brand is luxurious and minimalist. Use a sophisticated tone and a monochrome color palette (black, white, grey)."</p>
                            <p>• <span className="font-semibold">Keywords & Audience:</span> "Target young professionals. Use keywords like 'sustainable', 'eco-friendly', and 'ethically-sourced'."</p>
                            <p>• <span className="font-semibold">Negative Constraints:</span> "Avoid using humor or bright, neon colors. Do not show people's faces."</p>
                        </div>
                    </div>
                    {/* User Concept */}
                    <div>
                        <label htmlFor="userConcept" className="flex items-center space-x-1.5 text-sm font-medium text-gray-300">
                            <span>Your Ad Concept (Optional)</span>
                            <Tooltip text="Have a specific idea? Describe it here! For example, 'A close-up shot of the product being used in the rain.' The AI will take your concept and enhance it with trending strategies." />
                        </label>
                        <textarea
                            id="userConcept"
                            value={userConcept}
                            onChange={(e) => setUserConcept(e.target.value)}
                            disabled={stage === 'generatingIdeas'}
                            rows={3}
                            className="mt-1 block w-full bg-gray-900 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Have an idea? Describe it here and the AI will enhance it."
                        />
                    </div>
                    <div className="text-center pt-4">
                        <button
                            onClick={handleGenerateIdeas}
                            disabled={stage === 'generatingIdeas'}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {stage === 'generatingIdeas' ? <LoadingSpinner text="Generating Ideas..." /> : 'Generate Concept Ideas'}
                        </button>
                    </div>
                 </div>
            )}
            
            {stage === 'ideasGenerated' && (
                <ConceptIdeaSelector 
                    ideas={conceptIdeas} 
                    onConfirm={handleGenerateFullConcepts} 
                    isLoading={stage === 'generatingFullConcepts'}
                    title={conceptSelectorTitle}
                    subtitle={conceptSelectorSubtitle}
                />
            )}
            
            {stage === 'generatingFullConcepts' && <LoadingSpinner text="Generating Full Concepts..." />}
            
            {(stage === 'reviewingConcepts' || stage === 'generatingHooksAndCtasForSelection') && editableConcepts.length > 0 && (
                <div className="animate-fade-in">
                    <div className="text-center">
                        <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                            Review & Refine Your Concepts
                        </h2>
                        <p className="text-gray-400 mt-2">
                            This is your chance to edit the AI's suggestions before generating the final copy and prompts.
                        </p>
                        <div className="flex justify-center items-center space-x-4 mt-4 text-lg font-semibold">
                            <button onClick={() => setReviewIndex(0)} className={reviewIndex === 0 ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}>Concept 1</button>
                            <span className="text-gray-600">|</span>
                            <button onClick={() => setReviewIndex(1)} className={reviewIndex === 1 ? 'text-blue-400' : 'text-gray-500 hover:text-blue-400'}>Concept 2</button>
                        </div>
                    </div>
                    
                    <AdConceptCard concept={editableConcepts[reviewIndex]} />
                    <ConceptEditor 
                        concept={editableConcepts[reviewIndex]}
                        onEdit={handleConceptEdit}
                        onEnhanceStyling={handleEnhanceStyling}
                        isEnhancingStyling={isEnhancingStyling}
                    />

                    <div className="mt-8 p-6 bg-gray-900/50 rounded-lg">
                        <div className="text-center">
                            <h4 className="text-lg font-medium text-gray-200 mb-4">Select Language for Ad Copy</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[0, 1].map(index => (
                                <div key={index}>
                                    <label htmlFor={`language-select-${index}`} className="block text-sm font-medium text-gray-400 mb-2 truncate">
                                        Concept {index + 1}: {editableConcepts[index]?.optionName}
                                    </label>
                                    <select
                                        id={`language-select-${index}`}
                                        value={copyLanguages[index]}
                                        onChange={(e) => setCopyLanguages(prev => {
                                            const newLangs = [...prev];
                                            newLangs[index] = e.target.value;
                                            return newLangs;
                                        })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition duration-200"
                                    >
                                        {languageOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>


                    <div className="text-center mt-8">
                         <button
                            onClick={handleGenerateHooksAndCtasForSelection}
                            disabled={stage === 'generatingHooksAndCtasForSelection'}
                            className="w-full max-w-md flex justify-center items-center mx-auto bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:from-green-600 hover:to-teal-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {stage === 'generatingHooksAndCtasForSelection' ? <LoadingSpinner text="Generating Copy..." /> : 'Finalize Edits & Generate Copy Options'}
                        </button>
                    </div>
                </div>
            )}

            {stage === 'generatingHooksAndCtasForSelection' && !hooksAndCtasForSelection && <LoadingSpinner text="Generating Copy Options..." />}

            {stage === 'selectingHooksAndCtas' && hooksAndCtasForSelection && (
                <HookAndCtaSelector
                    concepts={adConcepts}
                    hooksAndCtas={hooksAndCtasForSelection}
                    onConfirm={handleFinalizeAndGenerateOutputs}
                    isLoading={stage === 'generatingFinalOutputs'}
                    advertType={advertType}
                />
            )}
            
            {stage === 'generatingFinalOutputs' && <LoadingSpinner text="Generating Final Outputs..." />}

            {stage === 'finalOutputsGenerated' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="text-center">
                         <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                            Your Final Ad Package is Ready!
                        </h2>
                    </div>

                    {imageGenPrompts && <ImageGenPromptDisplay prompts={imageGenPrompts} />}
                    {videoScripts && <VideoScriptDisplay scripts={videoScripts} />}
                    
                    {isGeneratingAbTests && <div className="flex justify-center pt-4"><LoadingSpinner text="Generating A/B Test Ideas..." /></div>}
                    {abTestVariations && <AbTestDisplay variations={abTestVariations} />}

                    <div className="text-center pt-4">
                        <button onClick={() => resetWorkflow(false)} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Start a New Project
                        </button>
                    </div>
                </div>
            )}
            
            {error && <ErrorMessage message={error} />}

        </div>
      </main>
    </div>
  );
};

export default App;