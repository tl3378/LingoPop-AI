import { Language } from './types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', voiceName: 'Puck' },
  { code: 'zh', name: 'Chinese (Mandarin)', flag: '🇨🇳', voiceName: 'Zephyr' }, // Using Zephyr as placeholder, will fallback if needed
  { code: 'es', name: 'Spanish', flag: '🇪🇸', voiceName: 'Kore' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳', voiceName: 'Kore' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦', voiceName: 'Fenrir' },
  { code: 'fr', name: 'French', flag: '🇫🇷', voiceName: 'Charon' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩', voiceName: 'Puck' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷', voiceName: 'Puck' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺', voiceName: 'Fenrir' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵', voiceName: 'Kore' },
  { code: 'it', name: 'Italian', flag: '🇮🇹', voiceName: 'Puck' },
];

export const MODEL_TEXT = 'gemini-2.5-flash';
export const MODEL_IMAGE = 'gemini-2.5-flash-image';
export const MODEL_TTS = 'gemini-2.5-flash-preview-tts';