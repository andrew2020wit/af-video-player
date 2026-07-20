export async function detectLanguage(text: string): Promise<string | null> {
  // 1. Check browser feature support
  if (!('LanguageDetector' in window) || !window.LanguageDetector) {
    console.warn('Language Detector API is not supported in this browser.');
    return null;
  }

  // 2. check translation availability
  const availability = await window.LanguageDetector.availability();
  if (availability === 'no' || availability === 'unavailable') {
    console.warn('Language detector model is unavailable.');
    return null;
  }

  // 3. Create detector instance
  const detector = await window.LanguageDetector.create();

  try {
    // 4. Run detection
    const results = await detector.detect(text);
    if (results.length > 0) {
      const topMatch = results[0];
      console.log(
        `Detected: ${topMatch.detectedLanguage} (${(topMatch.confidence * 100).toFixed(1)}%)`,
      );
      return topMatch.detectedLanguage;
    }
  } finally {
    // Always clean up resources when finished
    detector.destroy();
  }

  return null;
}
