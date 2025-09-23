import { Difficulty } from '../types';
import { words } from '../data/words';

/**
 * Shuffles an array in place.
 * @param array The array to shuffle.
 */
function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Fetches a specified number of unique words for a given difficulty.
 * @param difficulty The desired difficulty level.
 * @param count The number of words to fetch.
 * @returns An array of words.
 */
export const fetchWords = (difficulty: Difficulty, count: number): string[] => {
  const sourceWords = words[difficulty];
  if (!sourceWords) {
    console.warn(`No words found for difficulty: ${difficulty}`);
    return [];
  }
  // Return a shuffled slice of the words to ensure variety
  const shuffled = shuffle([...sourceWords]);
  return shuffled.slice(0, count);
};

/**
 * Gets the total word counts for each difficulty level.
 * @returns An object with difficulties as keys and word counts as values.
 */
export const getWordCounts = (): { [key in Difficulty]: number } => {
  return {
    [Difficulty.Easy]: words[Difficulty.Easy]?.length || 0,
    [Difficulty.Medium]: words[Difficulty.Medium]?.length || 0,
    [Difficulty.Hard]: words[Difficulty.Hard]?.length || 0,
  };
};
