export async function checkTranslationAvailability(): Promise<boolean> {
  if (!('LanguageDetector' in window) || !window.LanguageDetector) {
    return false;
  }

  const availability = await window.LanguageDetector.availability();

  if (availability === 'no' || availability === 'unavailable') {
    return false;
  }

  return true;
}
