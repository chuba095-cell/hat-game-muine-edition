
import React, { useState } from 'react';

interface TurnReviewProps {
  initialGuessedWords: string[];
  lastWord: string | undefined;
  onConfirm: (finalGuessedWords: string[]) => void;
}

const TurnReview: React.FC<TurnReviewProps> = ({ initialGuessedWords, lastWord, onConfirm }) => {
  const [confirmedWords, setConfirmedWords] = useState<Set<string>>(new Set(initialGuessedWords));
  const [isLastWordAdded, setIsLastWordAdded] = useState(false);

  const toggleWord = (word: string) => {
    const newConfirmedWords = new Set(confirmedWords);
    if (newConfirmedWords.has(word)) {
      newConfirmedWords.delete(word);
    } else {
      newConfirmedWords.add(word);
    }
    setConfirmedWords(newConfirmedWords);
  };

  const toggleLastWord = () => {
    if (lastWord) {
      setIsLastWordAdded(prev => !prev);
    }
  };

  const handleConfirm = () => {
    const finalWords = Array.from(confirmedWords);
    if (lastWord && isLastWordAdded) {
      finalWords.push(lastWord);
    }
    onConfirm(finalWords);
  };

  const hasWordsToList = initialGuessedWords.length > 0;

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Время вышло!</h1>
      <p className="text-lg text-gray-600 text-center mb-6">Проверьте угаданные слова.</p>

      {hasWordsToList && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Угаданные слова</h2>
          <p className="text-sm text-gray-500 mb-4">Нажмите на слово, чтобы отменить его засчитывание.</p>
          <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg max-h-60 overflow-y-auto">
            {initialGuessedWords.map((word) => {
              const isConfirmed = confirmedWords.has(word);
              return (
                <button
                  key={word}
                  onClick={() => toggleWord(word)}
                  className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-200 capitalize ${
                    isConfirmed 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-200 text-gray-500 line-through hover:bg-gray-300'
                  }`}
                >
                  {word}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {lastWord && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3 text-gray-700">Слово на последней секунде</h2>
          <p className="text-sm text-gray-500 mb-4">Успели объяснить это слово до сигнала?</p>
          <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={toggleLastWord}
              className={`w-full text-left px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center capitalize ${
                isLastWordAdded
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              <span className="mr-2 font-bold">{isLastWordAdded ? '✓' : '+'}</span>
              {lastWord}
            </button>
          </div>
        </div>
      )}
      
      {!hasWordsToList && !lastWord && (
          <p className="text-center text-gray-500 my-8">За этот ход не было угадано ни одного слова.</p>
      )}

      <button
        onClick={handleConfirm}
        className="w-full bg-indigo-600 text-white font-bold py-4 px-6 text-xl rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Подтвердить и продолжить
      </button>
    </div>
  );
};

export default TurnReview;
