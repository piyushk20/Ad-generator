import { GoogleGenAI, Type } from "@google/genai";
import { AdConcept, ConceptIdea, GenerativePart, HookAndCtaSet, ImageGenPrompt, VideoScript, AdvertStyle, VideoShot, AbTestVariation } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface CtaDetails {
    url?: string;
    whatsapp?: string;
}

// Step 1: Generate 5 high-level, trending ad styles based on the image.
export const generateAdvertStyles = async (
    imagePart: GenerativePart,
    advertType: 'still' | 'video'
): Promise<AdvertStyle[]> => {
    const format = advertType === 'still' ? 'still image' : 'short 8-10 second video';
    const prompt = `Analyze the provided product image. Based on its category and appearance, generate 5 distinct, highly trending, and successful ad STYLES for a ${format} campaign. One of these styles, especially if the format is video, should strongly consider a "User-Generated Content (UGC)" approach, as it's a very popular and effective trend. For each of the 5 styles, provide a catchy title and a brief summary explaining the style and why it's currently effective for getting high CTR. Other examples for video could be "Unboxing ASMR" or "Problem/Solution Demo". Examples for still image could be "Cinematic Product Shot" or "Bold Minimalism".`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [ { text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { 
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        summary: { type: Type.STRING }
                    },
                    required: ['title', 'summary']
                }
            },
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for advert styles:", response.text);
        throw new Error("The AI returned an invalid response for advert styles.");
    }
};

// Step 2: Generate 5 high-level concept ideas for the user to choose from, based on the selected style.
export const generateConceptIdeas = async (
    imagePart: GenerativePart,
    ctaDetails: CtaDetails,
    brandGuidelines: string,
    userConcept: string,
    selectedStyle: AdvertStyle,
    advertType: 'still' | 'video'
): Promise<ConceptIdea[]> => {
    const format = advertType === 'still' ? 'still image' : 'short 8-10 second video';
    let prompt: string;
    const coreInstruction = `Your task is to generate 5 distinct, highly trending, and attention-grabbing ad concept IDEAS for a ${format}, all aligned with the chosen ad style: "${selectedStyle.title}: ${selectedStyle.summary}". These should be high-level summaries, not full plans. Focus on what's current, viral, and proven to have a high CTR for this product category within the specified ad style.`;

    if (userConcept) {
        prompt = `You are a world-class AI creative director specializing in enhancing raw ideas into high-performing campaigns. A user has provided an image, their initial ad concept, a chosen format (${format}), and a guiding ad style.
        Your task is to act as a creative partner. Take the user's core idea and elevate it by blending it with 5 distinct, highly trending, and proven high-CTR (Click-Through Rate) strategies relevant to the product type, chosen format, and ad style. The goal is not to replace their idea, but to show them five professional, enhanced variations of it.

        ${coreInstruction}

        USER INPUTS:
        - Chosen Ad Style: "${selectedStyle.title}"
        - User's Raw Ad Concept to Enhance: "${userConcept}"
        - Brand Guidelines to consider: "${brandGuidelines || 'N/A'}"`;
    } else {
        prompt = `You are a world-class AI creative director. A user has provided an image, brand guidelines, a chosen format (${format}), and has chosen a guiding ad style.
        ${coreInstruction}

        USER INPUTS:
        - Chosen Ad Style: "${selectedStyle.title}"
        - Brand Guidelines: "${brandGuidelines || 'N/A'}"`;
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [ { text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: 'A short, catchy, and descriptive title for the concept idea.' },
                        summary: { type: Type.STRING, description: `A one or two-sentence summary explaining the core of the highly trending, attention-grabbing ad concept for a ${format}.` }
                    },
                    required: ['title', 'summary']
                }
            },
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for ideas:", response.text);
        throw new Error("The AI returned an invalid response for concept ideas.");
    }
};

// Step 3: Generate full, detailed concepts based on the user's selection.
export const generateFullConcepts = async (
    imagePart: GenerativePart,
    ctaDetails: CtaDetails,
    brandGuidelines: string,
    userConcept: string, // Although not directly used in the prompt, it provides context.
    selectedIdeas: ConceptIdea[],
    advertType: 'still' | 'video',
    selectedStyle: AdvertStyle
): Promise<AdConcept[]> => {
    const isVideo = advertType === 'video';
    const format = isVideo ? 'short 8-10 second video' : 'still image';
    const budget = isVideo ? '$300,000 video commercial' : 'high-end commercial photoshoot';
    const ctaString = `CTA can target a URL ('${ctaDetails.url || 'not provided'}') or WhatsApp ('${ctaDetails.whatsapp || 'not provided'}'). The AI should craft a suitable CTA text based on these, like 'Shop Now' or 'Message Us'.`;

    const commonVideoProperties = {
        cameraMovement: { type: Type.STRING, description: 'e.g., Fast-paced tracking shots, slow dramatic pans.'},
        editingStyle: { type: Type.STRING, description: 'e.g., Quick cuts, seamless transitions, split screens.'},
        soundDesign: { type: Type.STRING, description: 'e.g., Upbeat trending song, custom sound effects, ASMR sounds.'},
        videoDuration: { type: Type.STRING, description: 'An exact video duration like "8 seconds" or "10 seconds".' },
    };

    const commonProperties = {
        optionName: { type: Type.STRING, description: 'The original catchy title for the concept.' },
        conceptSummary: { type: Type.STRING, description: 'A one-sentence summary of the ad concept.'},
        shootSetup: { type: Type.STRING, description: `For a ${format}, describe the complete scene, environment, props, and product placement in rich detail.`},
        stylingNotes: { type: Type.STRING, description: 'Detailed notes on lighting, color palette, textures, and overall aesthetic.'},
        postProduction: { type: Type.STRING, description: 'Key post-production effects, color grading, and text overlays.'},
        hookLine: { type: Type.STRING, description: 'A powerful, attention-grabbing opening line for the ad copy.'},
        adCopy: { type: Type.STRING, description: 'Compelling ad copy (2-3 sentences) that expands on the hook and highlights a key benefit.'},
        cta: { type: Type.STRING, description: 'A clear and concise call to action.'},
        trendReasoning: { type: Type.STRING, description: 'A brief explanation of why this specific concept is trending and effective for high CTR.'},
        format: { type: Type.STRING, description: `The format, which must be '${isVideo ? "Short Video" : "Still Image"}'`},
        technicalSpecs: {
            type: Type.OBJECT,
            properties: {
                camera: { type: Type.STRING, description: 'e.g., High-end cinema camera, professional DSLR.' },
                lenses: { type: Type.STRING, description: isVideo ? 'e.g., Wide-angle for dynamic shots, Macro for detail.' : 'e.g., 85mm f/1.4 for portrait, 100mm macro for details.' },
                angles: { type: Type.STRING, description: isVideo ? 'e.g., Low-angle hero shots, top-down flat lays, POV shots.' : 'e.g., Eye-level, 45-degree angle, flat lay.' },
                specs: { type: Type.STRING, description: isVideo ? 'e.g., 4K resolution at 60fps.' : 'e.g., High-resolution for print, web-optimized.' },
                mood: { type: Type.STRING, description: 'e.g., Energetic and vibrant, moody and cinematic, clean and minimalist.'},
                ...(isVideo ? commonVideoProperties : {})
            },
            required: ['camera', 'lenses', 'angles', 'specs', 'mood']
        }
    };

    const prompt = `You are a world-class AI Creative Director for a top ad agency. You're creating a full production plan for a ${budget}.
    Your task is to expand the two selected high-level concept ideas into fully-detailed, professional ${format} ad concepts. Be extremely specific, creative, and professional. The output MUST be a JSON array with two objects.

    USER INPUTS:
    - Chosen Ad Style: "${selectedStyle.title}: ${selectedStyle.summary}"
    - Brand Guidelines: "${brandGuidelines || 'N/A'}"
    - ${ctaString}
    - Concept Idea 1: "${selectedIdeas[0].title}: ${selectedIdeas[0].summary}"
    - Concept Idea 2: "${selectedIdeas[1].title}: ${selectedIdeas[1].summary}"
    
    For EACH of the two ideas, provide a complete plan covering all aspects from pre-production to post-production. Use the provided JSON schema. Ensure all fields are filled with rich, actionable detail. The "optionName" must be the original title of the concept idea.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        ...commonProperties,
                        ...(isVideo ? { videoDuration: { type: Type.STRING } } : {})
                    },
                    required: ['optionName', 'conceptSummary', 'shootSetup', 'stylingNotes', 'postProduction', 'hookLine', 'adCopy', 'cta', 'trendReasoning', 'format', 'technicalSpecs']
                }
            }
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for full concepts:", response.text);
        throw new Error("The AI returned an invalid response for the full concepts.");
    }
};

export const enhanceStylingNotes = async (concept: AdConcept): Promise<string> => {
    const prompt = `You are an expert art director and stylist. A junior creative has provided a concept with some basic styling notes. Your task is to enhance and expand upon these notes.
    Make them more professional, detailed, and evocative. Consider lighting techniques, color theory, texture, prop selection, and overall mood to elevate the concept.
    
    ORIGINAL CONCEPT:
    - Summary: ${concept.conceptSummary}
    - Shoot Setup: ${concept.shootSetup}
    - Existing Styling Notes: "${concept.stylingNotes}"

    Return ONLY the new, enhanced styling notes as a single block of text. Do not return any other text or formatting.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
    });
    
    return response.text.trim();
};

export const generateHooksAndCtas = async (
    imagePart: GenerativePart,
    concepts: AdConcept[],
    ctaDetails: CtaDetails,
    languages: [string, string]
): Promise<HookAndCtaSet[]> => {
    const ctaString = `Base the CTAs on these targets: URL ('${ctaDetails.url || 'not provided'}') or WhatsApp ('${ctaDetails.whatsapp || 'not provided'}').`;

    const prompt = `You are an expert direct-response copywriter. Your task is to generate a set of high-CTR hooks and calls-to-action (CTAs) for two distinct ad concepts. Pay close attention to the specified language for each concept.

    ${ctaString}

    CONCEPT 1:
    - Name: "${concepts[0].optionName}"
    - Summary: "${concepts[0].conceptSummary}"
    - Target Language: ${languages[0]}
    - Task: Generate 5 unique, punchy hooks and 5 unique, clear CTAs in ${languages[0]}.

    CONCEPT 2:
    - Name: "${concepts[1].optionName}"
    - Summary: "${concepts[1].conceptSummary}"
    - Target Language: ${languages[1]}
    - Task: Generate 5 unique, punchy hooks and 5 unique, clear CTAs in ${languages[1]}.
    
    Return the result as a JSON array with two objects, one for each concept, following the schema.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        hooks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        ctas: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ['hooks', 'ctas']
                }
            }
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for hooks and CTAs:", response.text);
        throw new Error("The AI returned an invalid response for hooks and CTAs.");
    }
};

export const generateImagePrompts = async (
    imagePart: GenerativePart,
    concepts: AdConcept[],
    priceTag: string
): Promise<ImageGenPrompt[]> => {
    const priceTagString = priceTag ? `Incorporate a stylish price tag sticker showing "${priceTag}".` : '';
    const prompt = `You are an expert prompt engineer for generative image models like Gemini Flash Image or Imagen. Your task is to create two ultra-detailed, professional image generation prompts based on the two finalized ad concepts provided. The prompts should be so descriptive that they can generate a photorealistic, studio-quality commercial image.

    For EACH of the two concepts, create a single, comprehensive prompt. The prompt must synthesize all the provided details:
    - **Subject & Composition:** Describe the product from the user's uploaded image, its placement, the environment, and any props as described in the "shootSetup".
    - **Lighting & Mood:** Capture the essence of the "stylingNotes" and "mood". Use terms like "cinematic lighting," "soft natural light," "dramatic shadows," "vibrant and energetic."
    - **Camera & Technicals:** Incorporate the specified "camera," "lenses," and "angles." Use photographic terms like "macro shot," "wide-angle," "depth of field," "bokeh."
    - **Aesthetics & Post-Production:** Include the "postProduction" notes, such as "color graded with a warm vintage feel," "hyper-realistic detail," "glossy magazine finish."
    - **Price Tag:** ${priceTagString}

    The final output should be a JSON array containing two objects, each with the original concept name, the final generated prompt, and the final call-to-action text for that concept.

    CONCEPT 1 DETAILS:
    - Name: ${concepts[0].optionName}
    - Summary: ${concepts[0].conceptSummary}
    - Shoot Setup: ${concepts[0].shootSetup}
    - Styling: ${concepts[0].stylingNotes}
    - Technical Specs: ${JSON.stringify(concepts[0].technicalSpecs)}
    - Post-Production: ${concepts[0].postProduction}
    - Final CTA: ${concepts[0].cta}

    CONCEPT 2 DETAILS:
    - Name: ${concepts[1].optionName}
    - Summary: ${concepts[1].conceptSummary}
    - Shoot Setup: ${concepts[1].shootSetup}
    - Styling: ${concepts[1].stylingNotes}
    - Technical Specs: ${JSON.stringify(concepts[1].technicalSpecs)}
    - Post-Production: ${concepts[1].postProduction}
    - Final CTA: ${concepts[1].cta}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        conceptName: { type: Type.STRING },
                        prompt: { type: Type.STRING },
                        cta: { type: Type.STRING }
                    },
                    required: ['conceptName', 'prompt', 'cta']
                }
            }
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for image prompts:", response.text);
        throw new Error("The AI returned an invalid response for image prompts.");
    }
};

export const generateVideoScripts = async (
    imagePart: GenerativePart,
    concepts: AdConcept[],
    brandName: string
): Promise<VideoScript[]> => {
    const brandNameString = brandName ? `The brand name is "${brandName}". This can be used in graphics or narration.` : '';
    const prompt = `You are an expert video producer and scriptwriter for a high-budget commercial production house. Your task is to create two complete, shot-by-shot video scripts based on the two finalized ad concepts. Each video should be approximately 8-10 seconds long.

    For EACH of the two concepts, generate a detailed script as an array of "shot" objects. Each shot object must have a timestamp (e.g., "0-2s", "2-4s"), and descriptions for camera, audio, narration, and graphics.
    - **Synthesize all details:** The script must bring the concept to life, incorporating the 'shootSetup', 'stylingNotes', and all technical specs like 'cameraMovement', 'editingStyle', 'keyShots', and 'soundDesign'.
    - **Narration and Graphics:** Write compelling, concise narration (if any) and specify any on-screen text or graphic overlays (like logos or product features).
    - **Brand Name:** ${brandNameString}
    
    The final output should be a JSON array containing two objects, each representing a full video script. Each object must have the original concept name, the final call-to-action, and an array of shot objects.

    CONCEPT 1 DETAILS:
    - Name: ${concepts[0].optionName}
    - Summary: ${concepts[0].conceptSummary}
    - Shoot Setup: ${concepts[0].shootSetup}
    - Styling & Post-Production: ${concepts[0].stylingNotes}, ${concepts[0].postProduction}
    - Technical Specs: ${JSON.stringify(concepts[0].technicalSpecs)}
    - Final CTA: ${concepts[0].cta}

    CONCEPT 2 DETAILS:
    - Name: ${concepts[1].optionName}
    - Summary: ${concepts[1].conceptSummary}
    - Shoot Setup: ${concepts[1].shootSetup}
    - Styling & Post-Production: ${concepts[1].stylingNotes}, ${concepts[1].postProduction}
    - Technical Specs: ${JSON.stringify(concepts[1].technicalSpecs)}
    - Final CTA: ${concepts[1].cta}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro', // Using Pro for higher quality script generation
        contents: { parts: [{ text: prompt }, imagePart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        conceptName: { type: Type.STRING },
                        cta: { type: Type.STRING },
                        shots: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timestamp: { type: Type.STRING, description: 'e.g., "0-2s"' },
                                    camera: { type: Type.STRING, description: 'Detailed camera action for this shot.' },
                                    audio: { type: Type.STRING, description: 'Sound effects or music cues.' },
                                    narration: { type: Type.STRING, description: 'Voice-over line for this shot (or "N/A").' },
                                    graphics: { type: Type.STRING, description: 'On-screen text or logos (or "N/A").' }
                                },
                                required: ['timestamp', 'camera', 'audio', 'narration', 'graphics']
                            }
                        }
                    },
                    required: ['conceptName', 'cta', 'shots']
                }
            }
        }
    });

    try {
        const parsedResponse = JSON.parse(response.text.trim());
        // Simple validation to ensure the nested structure is as expected.
        if (parsedResponse.some((script: any) => !Array.isArray(script.shots))) {
            throw new Error("Invalid structure for video script shots.");
        }
        return parsedResponse;
    } catch (e) {
        console.error("Failed to parse JSON for video scripts:", response.text, e);
        throw new Error("The AI returned an invalid response for video scripts.");
    }
};

export const generateAbTestVariations = async (
    concepts: AdConcept[]
): Promise<AbTestVariation[]> => {
    const prompt = `You are a marketing strategist specializing in A/B testing for digital ads. Based on the two finalized ad concepts provided, generate 2-3 simple, high-impact A/B test variations for EACH concept. These variations should be easy to implement. Focus on changing one variable at a time.

    Suggestions can include:
    1.  **Hook/Copy Variation:** Suggest an alternative hook or ad copy with a different angle (e.g., emotional vs. rational).
    2.  **CTA Variation:** Suggest a different Call-To-Action text (e.g., "Learn More" vs. "Shop Now").
    3.  **Visual Tweak:** Suggest a simple visual change. For images, this could be background color, lighting mood. For videos, it could be changing the music pace or the first shot. Be specific.

    Return the result as a JSON array with two objects, one for each concept, following the schema.

    CONCEPT 1 DETAILS:
    - Name: ${concepts[0].optionName}
    - Summary: ${concepts[0].conceptSummary}
    - Final Hook: ${concepts[0].hookLine}
    - Final Ad Copy: ${concepts[0].adCopy}
    - Final CTA: ${concepts[0].cta}
    - Visual Style: ${concepts[0].stylingNotes}

    CONCEPT 2 DETAILS:
    - Name: ${concepts[1].optionName}
    - Summary: ${concepts[1].conceptSummary}
    - Final Hook: ${concepts[1].hookLine}
    - Final Ad Copy: ${concepts[1].adCopy}
    - Final CTA: ${concepts[1].cta}
    - Visual Style: ${concepts[1].stylingNotes}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        conceptName: { type: Type.STRING },
                        variations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING, description: "e.g., 'Alternative Hook', 'Visual Style Tweak', 'CTA Change'" },
                                    description: { type: Type.STRING, description: "A brief explanation of why this test is valuable." },
                                    suggestion: { type: Type.STRING, description: "The concrete suggestion, e.g., the new hook text or the visual change description." }
                                },
                                required: ['title', 'description', 'suggestion']
                            }
                        }
                    },
                    required: ['conceptName', 'variations']
                }
            }
        }
    });

    try {
        return JSON.parse(response.text.trim());
    } catch (e) {
        console.error("Failed to parse JSON for A/B test variations:", response.text);
        throw new Error("The AI returned an invalid response for A/B test variations.");
    }
};
