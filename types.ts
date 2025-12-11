export interface Language {
  code: string;
  name: string;
  flag: string; // Emoji flag
  voiceName: string; // Gemini TTS voice name mapping
}

export interface Example {
  text: string;
  translation: string;
}

export interface DictionaryResult {
  word: string;
  definition: string;
  examples: Example[];
  friendlyExplanation: string; // The "chatty" explanation
  imageUrl?: string;
}

export interface NotebookItem extends DictionaryResult {
  id: string;
  timestamp: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type AppView = 'onboarding' | 'search' | 'result' | 'notebook';

export enum FlashcardSide {
  FRONT = 'FRONT',
  BACK = 'BACK'
}
