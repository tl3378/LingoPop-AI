import { GoogleGenAI, Type, Modality } from "@google/genai";
import { MODEL_TEXT, MODEL_IMAGE, MODEL_TTS } from '../constants';
import { DictionaryResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Helper: Decode Audio ---
async function decodeAudioData(
  base64String: string,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // The API returns raw PCM 24kHz Mono usually
  // We need to construct the buffer manually because decodeAudioData expects file headers (wav/mp3)
  // unless we wrap it, but the new API guidelines suggest manual float conversion for raw PCM.
  // HOWEVER, for `gemini-2.5-flash-preview-tts`, the output is often raw PCM.
  // Let's use the provided helper from the guidelines.

  const dataInt16 = new Int16Array(bytes.buffer);
  const numChannels = 1;
  const sampleRate = 24000;
  const frameCount = dataInt16.length / numChannels;
  
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 to Float32 [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- 1. Dictionary Lookup ---
export async function lookupWord(
  term: string,
  nativeLang: string,
  targetLang: string
): Promise<DictionaryResult> {
  
  const prompt = `
    Analyze the text "${term}". 
    Target Language: ${targetLang}. 
    User's Native Language: ${nativeLang}.

    1. Definition: Provide a natural, easy-to-understand definition in ${nativeLang}.
    2. Examples: Provide 2 sentences in ${targetLang} containing the term, with ${nativeLang} translations.
    3. Friendly Explanation: You are a cool, witty friend. Explain the cultural context, usage nuances, tone (formal/slang), or similar confusing words. Be very concise, fun, and direct. Avoid textbook style. Write this in ${nativeLang}.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING, description: "The corrected headword or phrase in target language" },
          definition: { type: Type.STRING },
          examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                translation: { type: Type.STRING },
              },
            },
          },
          friendlyExplanation: { type: Type.STRING },
        },
        required: ["word", "definition", "examples", "friendlyExplanation"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data returned");
  return JSON.parse(text) as DictionaryResult;
}

// --- 2. Image Generation ---
export async function generateConceptImage(term: string): Promise<string | undefined> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_IMAGE,
      contents: `A bright, colorful, minimalist vector art illustration representing the concept: "${term}". Plain background. High contrast. Fun style.`,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  } catch (e) {
    console.error("Image generation failed", e);
    return undefined;
  }
}

// --- 3. TTS Generation ---
export async function playTTS(text: string, voiceName: string = 'Puck') {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: { parts: [{ text }] },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass({ sampleRate: 24000 });
    
    const audioBuffer = await decodeAudioData(base64Audio, audioCtx);
    
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

  } catch (e) {
    console.error("TTS failed", e);
  }
}

// --- 4. Story Generation ---
export async function generateStory(words: string[], nativeLang: string, targetLang: string): Promise<string> {
  const prompt = `Create a short, funny story (max 150 words) in ${targetLang} using these words: ${words.join(', ')}. 
  Then provide a translation in ${nativeLang}. 
  Format: 
  [Story in ${targetLang}]
  
  ---
  
  [Translation in ${nativeLang}]`;

  const response = await ai.models.generateContent({
    model: MODEL_TEXT,
    contents: prompt,
  });
  return response.text || "Could not generate story.";
}

// --- 5. Chat Helper ---
export async function sendChatMessage(history: any[], newMessage: string, contextWord: string, nativeLang: string) {
  const systemInstruction = `You are a helpful language tutor assistant. 
  The user is learning the word/phrase: "${contextWord}". 
  The user speaks ${nativeLang}.
  Answer questions about this specific word, its grammar, or usage. Keep answers short and encouraging.`;

  const chat = ai.chats.create({
    model: MODEL_TEXT,
    config: { systemInstruction },
    history: history,
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text;
}
