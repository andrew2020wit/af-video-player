export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  if (!('Translator' in window) || !window.Translator) {
    alert('Translator API is not supported in this browser.');

    return '';
  }

  if (sourceLang === targetLang) return text;

  // 2. Verify availability for the language pair
  const availability = await window.Translator.availability({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
  });

  if (availability === 'no' || availability === 'unavailable') {
    alert(`Translation from ${sourceLang} to ${targetLang} is not supported.`);
  }

  // Instantiate translator (with optional download progress listener)
  const translator = await window.Translator.create({
    sourceLanguage: sourceLang,
    targetLanguage: targetLang,
    monitor(m) {
      m.addEventListener('downloadprogress', (e: Event) => {
        const progressEvent = e as ProgressEvent;
        console.log(
          `Downloading translation model: ${Math.round((progressEvent.loaded / progressEvent.total) * 100)}%`,
        );
      });
    },
  });

  try {
    const result = await translator.translate(text);

    return result;
  } finally {
    translator.destroy();
  }
}
