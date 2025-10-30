// Note: The Flesch-Kincaid formula and this syllable counter are designed for English.
// The results for Thai text will be an approximation and may not be accurate.

const countSyllables = (word: string): number => {
  word = word.toLowerCase().trim();
  if (word.length <= 3) { return 1; }
  // Remove common suffixes
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  // Remove leading 'y'
  word = word.replace(/^y/, '');
  // Count vowel groups
  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  return vowelGroups ? Math.max(1, vowelGroups.length) : 1;
};

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const countSentences = (text: string): number => {
  if (!text) return 0;
  // Count sentences ending with '.', '!', or '?'
  const sentenceEndings = text.match(/[.!?]+(\s|$)/g);
  // If there's text but no sentence-ending punctuation, assume it's one sentence.
  return sentenceEndings ? sentenceEndings.length : 1;
};

export const calculateFleschKincaid = (text: string): { score: number; level: string } => {
  const totalWords = countWords(text);
  const totalSentences = countSentences(text);
  
  if (totalWords === 0 || totalSentences === 0) {
    return { score: 0, level: 'ข้อมูลไม่เพียงพอ' };
  }
  
  const totalSyllables = text.trim().split(/\s+/).reduce((acc, word) => acc + countSyllables(word), 0);

  // Flesch-Kincaid Grade Level formula
  const score = 0.39 * (totalWords / totalSentences) + 11.8 * (totalSyllables / totalWords) - 15.59;
  
  const roundedScore = Math.max(0, Math.round(score));

  let level: string;
  if (roundedScore >= 13) {
    level = 'ระดับวิทยาลัย';
  } else if (roundedScore > 0) {
    level = `ประมาณระดับชั้น ป.${roundedScore}`;
  } else {
    level = 'อ่านง่ายมาก';
  }

  return { score: roundedScore, level };
};