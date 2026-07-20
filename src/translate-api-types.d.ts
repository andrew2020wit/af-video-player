// ambient.d.ts or top of your file
type AICapabilityAvailability =
  'no' | 'readily' | 'after-download' | 'unavailable' | 'downloadable';

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface LanguageDetector {
  detect(text: string): Promise<LanguageDetectionResult[]>;
  destroy(): void;
}

interface LanguageDetectorFactory {
  availability(): Promise<AICapabilityAvailability>;
  create(options?: {
    expectedInputLanguages?: string[];
    monitor?: (m: EventTarget) => void;
  }): Promise<LanguageDetector>;
}

interface Translator {
  translate(text: string): Promise<string>;
  translateStreaming(text: string): ReadableStream<string>;
  destroy(): void;
}

interface TranslatorFactory {
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<AICapabilityAvailability>;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
  }): Promise<Translator>;
}

declare global {
  interface Window {
    LanguageDetector?: LanguageDetectorFactory;
    Translator?: TranslatorFactory;
  }
}

export {};
