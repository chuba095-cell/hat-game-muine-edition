import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, Team } from '../types';
import { playCorrectSound, playTimerEndSound, playTimerTickSound, unlockAudio, playPauseSound, playUnpauseSound } from '../services/soundService';

interface GameplayProps {
  timerDuration: number;
  wordPool: string[];
  onTurnFinish: (guessedWords: string[], lastWord: string | undefined, remainingTime?: number) => void;
  currentPlayer: Player;
  currentTeam: Team;
  roundName: string;
  roundDescription: string;
}

const Gameplay: React.FC<GameplayProps> = ({
  timerDuration,
  wordPool,
  onTurnFinish,
  currentPlayer,
  currentTeam,
  roundName,
  roundDescription,
}) => {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedWords, setGuessedWords] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // FIX: In browser environments, setInterval returns a number, not a NodeJS.Timeout object.
  const timerRef = useRef<number | null>(null);
  
  const getWordFontSize = (word: string | undefined): string => {
    if (!word) return '3.75rem';
    const length = word.length;
    if (length <= 8) return '5rem';    // 80px
    if (length <= 12) return '4rem';   // 64px
    if (length <= 16) return '3.25rem';// 52px
    if (length <= 20) return '2.75rem';// 44px
    return '2.25rem';                  // 36px
  };

  useEffect(() => {
    // Shuffle words on component mount
    setShuffledWords([...wordPool].sort(() => Math.random() - 0.5));
  }, [wordPool]);

  // Timer logic
  useEffect(() => {
    if (isGameActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            playTimerEndSound();
            onTurnFinish(guessedWords, shuffledWords[currentWordIndex], 0);
            return 0;
          }
          if (prev <= 6 && prev > 1) {
            playTimerTickSound();
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameActive, isPaused]);

  const handleStartGame = () => {
    unlockAudio();
    setIsGameActive(true);
  };

  const nextWord = useCallback(() => {
    if (currentWordIndex >= shuffledWords.length - 1) {
      // End of words, finish turn with remaining time
      if (timerRef.current) clearInterval(timerRef.current);
      onTurnFinish(guessedWords, undefined, timeLeft);
    } else {
      setCurrentWordIndex(prev => prev + 1);
    }
  }, [currentWordIndex, shuffledWords.length, onTurnFinish, guessedWords, timeLeft]);

  const handleCorrect = () => {
    playCorrectSound();
    setGuessedWords(prev => [...prev, shuffledWords[currentWordIndex]]);
    nextWord();
  };

  const handleSkip = () => {
    nextWord();
  };

  const togglePause = () => {
    setIsPaused(prev => {
      if (prev) {
        playUnpauseSound();
      } else {
        playPauseSound();
      }
      return !prev;
    });
  };

  const currentWord = shuffledWords[currentWordIndex];
  
  // Render logic: Pre-game screen
  if (!isGameActive) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto animate-fade-in">
        <h2 className={`text-2xl font-bold mb-2 ${currentTeam.color.textColor}`}>Раунд: {roundName}</h2>
        <p className="text-gray-600 mb-4">{roundDescription}</p>
        <div className="my-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-lg text-gray-500">Сейчас объясняет:</p>
          <p className={`text-4xl font-extrabold ${currentTeam.color.textColor}`}>{currentPlayer.name}</p>
          <p className="text-lg text-gray-500">из команды «{currentTeam.name.replace('Команда ', '')}»</p>
        </div>
        <p className="text-gray-600 mb-8">Приготовьтесь! У вас будет {timerDuration} секунд.</p>
        <button onClick={handleStartGame} className="w-full bg-green-500 text-white font-bold py-4 px-6 text-xl rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          Начать
        </button>
      </div>
    );
  }
  
  // Render logic: Pause screen
  if (isPaused) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Пауза</h2>
        <p className="text-xl text-gray-600 mb-8">Осталось времени: {timeLeft} сек</p>
        <button onClick={togglePause} className="w-full bg-indigo-600 text-white font-bold py-4 px-6 text-xl rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
          Продолжить
        </button>
      </div>
    );
  }
  
  // Render logic: Out of words
  if (!currentWord) {
    return (
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Слова закончились!</h2>
        <p className="text-lg mb-6 text-gray-600">Отличная работа! Вы объяснили все слова.</p>
      </div>
    );
  }

  // Render logic: Active game screen
  const timerColor = timeLeft <= 10 ? 'text-red-500' : 'text-gray-800';
  const progressPercentage = (timeLeft / timerDuration) * 100;
  const progressColor = timeLeft <= 10 ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="flex flex-col h-[80vh] max-h-[700px] w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-6 pt-10 relative overflow-hidden">
      <header className="flex justify-between items-center mb-4">
        <div className="text-left">
          <p className={`text-lg font-bold ${currentTeam.color.textColor}`}>{currentPlayer.name}</p>
          <p className="text-sm text-gray-500">Очки за ход: <span className="font-bold text-indigo-600 text-lg">{guessedWords.length}</span></p>
        </div>
        <div className="text-right">
          <div className={`text-5xl font-bold ${timerColor}`}>{timeLeft}</div>
        </div>
      </header>
      
      <div className="absolute top-0 left-0 h-2.5 bg-gray-200 w-full">
        <div 
          className={`h-full ${progressColor} transition-all duration-1000 linear`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="flex-grow flex items-center justify-center text-center p-4 my-4 bg-gray-50 rounded-lg">
        <h1 
          className="font-extrabold text-gray-800 capitalize break-words animate-pop-in"
          style={{ fontSize: getWordFontSize(currentWord), lineHeight: '1.1' }}
        >
          {currentWord}
        </h1>
      </div>

      <footer className="grid grid-cols-2 gap-4">
        <button onClick={handleSkip} className="w-full bg-yellow-400 text-yellow-900 font-bold py-6 text-2xl rounded-lg hover:bg-yellow-500 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2">
          Пропустить
        </button>
        <button onClick={handleCorrect} className="w-full bg-green-500 text-white font-bold py-6 text-2xl rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
          Правильно
        </button>
      </footer>
      
      <button onClick={togglePause} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
        </svg>
      </button>

    </div>
  );
};

export default Gameplay;