
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, Team } from '../types';
import { playCorrectSound, unlockAudio, playTimerEndSound, playTimerTickSound, playPauseSound, playUnpauseSound } from '../services/soundService';
import { dictionary } from '../data/dictionary';

interface GameplayProps {
  wordPool: string[];
  onTurnFinish: (wordsGuessedThisTurn: string[], lastWord: string | undefined, remainingTime?: number) => void;
  currentPlayer: Player;
  currentTeam: Team;
  timerDuration: number;
  roundName: string;
  roundDescription: string;
}

const getWordFontSize = (word: string | undefined): string => {
    if (!word) return 'text-2xl';
    const length = word.length;
    if (length <= 8) return 'sm:text-5xl text-4xl';
    if (length <= 12) return 'sm:text-4xl text-3xl';
    if (length <= 18) return 'sm:text-3xl text-2xl';
    if (length <= 25) return 'sm:text-2xl text-xl';
    return 'sm:text-xl text-lg';
};

const Gameplay: React.FC<GameplayProps> = ({ wordPool, onTurnFinish, currentPlayer, currentTeam, timerDuration, roundName, roundDescription }) => {
  const [timer, setTimer] = useState(timerDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [guessedWordsThisTurn, setGuessedWordsThisTurn] = useState<string[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showDictionary, setShowDictionary] = useState(false);
  const dictionaryPausedGame = useRef(false);

  const timeoutCallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // On every render, update the ref with a new callback that has the latest state.
    timeoutCallbackRef.current = () => {
      playTimerEndSound();
      setIsTimerRunning(false);
      onTurnFinish(guessedWordsThisTurn, wordPool[currentWordIndex]);
    };
  }, [guessedWordsThisTurn, wordPool, currentWordIndex, onTurnFinish]);

  useEffect(() => {
    // The main timer interval logic.
    // It only re-runs if the timer is started, stopped, or paused.
    // Clicking "Next Word" will NOT cause this effect to re-run and reset the 1-second tick.
    if (!isTimerRunning || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 1) {
          clearInterval(interval);
          timeoutCallbackRef.current?.(); // Execute the timeout logic
          return 0;
        }
        if (prevTimer <= 4 && prevTimer > 1) {
          playTimerTickSound();
        }
        return prevTimer - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, isPaused]);
  
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timerId = setTimeout(() => {
        setCountdown(c => (c !== null ? c - 1 : null));
      }, 1000);
      return () => clearTimeout(timerId);
    } else { // countdown is 0
      const startTimerId = setTimeout(() => {
        setIsTimerRunning(true);
        setCountdown(null);
      }, 800);
      return () => clearTimeout(startTimerId);
    }
  }, [countdown]);


  const startCountdown = () => {
    unlockAudio();
    setCountdown(3);
  };
  
  const togglePause = () => {
    if (isPaused) {
      playUnpauseSound();
    } else {
      playPauseSound();
    }
    setIsPaused(prev => !prev);
  };
  
  const handleShowDictionary = () => {
    if (!isPaused) {
        togglePause();
        dictionaryPausedGame.current = true;
    } else {
        dictionaryPausedGame.current = false;
    }
    setShowDictionary(true);
  };

  const handleCloseDictionary = () => {
      setShowDictionary(false);
      if (dictionaryPausedGame.current) {
          togglePause();
      }
      dictionaryPausedGame.current = false;
  };

  const handleNextWord = useCallback(() => {
    playCorrectSound();
    if (currentWordIndex < wordPool.length) {
        const newGuessedWords = [...guessedWordsThisTurn, wordPool[currentWordIndex]];
        setGuessedWordsThisTurn(newGuessedWords);
        
        if (currentWordIndex + 1 >= wordPool.length) {
             // Words ran out, finish the turn and pass remaining time
             setIsTimerRunning(false);
             onTurnFinish(newGuessedWords, undefined, timer);
        } else {
            setCurrentWordIndex(prev => prev + 1);
        }
    }
  }, [currentWordIndex, wordPool, onTurnFinish, guessedWordsThisTurn, timer]);

  const currentWord = wordPool[currentWordIndex];
  const dictionaryEntry = currentWord ? dictionary[currentWord.toLowerCase()] : undefined;
  const timerProgress = (timer / timerDuration) * 100;
  const wordFontSize = getWordFontSize(currentWord);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 bg-white rounded-2xl shadow-2xl text-center">
      <div className="mb-4 text-center border-b border-gray-200 pb-4">
          <p className="text-lg font-semibold text-gray-600">
            Раунд: <span className="text-indigo-600 font-bold">{roundName}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">{roundDescription}</p>
      </div>

      <div className="mb-6">
        <p className="text-xl text-gray-500">Ход команды:</p>
        <h3 className={`text-2xl sm:text-3xl font-bold ${currentTeam.color.textColor}`}>{currentTeam.name}</h3>
        <p className="text-xl text-gray-500 mt-2">Играет:</p>
        <h2 className={`text-3xl sm:text-4xl font-extrabold ${currentTeam.color.textColor}`}>{currentPlayer.name}</h2>
      </div>
      
      {!isTimerRunning && countdown === null && (
        <div className="flex flex-col items-center">
            <div className="mb-6 bg-gray-100 p-4 rounded-lg text-center shadow-inner">
              <p className="text-lg font-medium text-gray-700">Осталось слов в шляпе:</p>
              <p className="text-3xl sm:text-4xl font-bold text-indigo-600">{wordPool.length}</p>
            </div>
            <p className="text-lg text-gray-600 mb-6">Готов(а)?</p>
            <button
                onClick={startCountdown}
                className="bg-green-500 text-white font-bold py-3 px-8 sm:py-4 sm:px-10 text-xl sm:text-2xl rounded-xl hover:bg-green-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
            >
                Запуск таймера
            </button>
        </div>
      )}

      {!isTimerRunning && countdown !== null && (
        <div className="flex flex-col items-center justify-center min-h-[300px] font-extrabold text-indigo-600">
          {countdown > 0 ? (
            <p key={countdown} className="animate-pop-in text-8xl sm:text-9xl">{countdown}</p>
          ) : (
            <p key="start" className="animate-pop-in text-7xl sm:text-8xl">Старт!</p>
          )}
        </div>
      )}
      
      {isTimerRunning && (
        <div className="flex flex-col items-center">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                      className="text-gray-200"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="45"
                      cx="50"
                      cy="50"
                  />
                  <circle
                      className="text-indigo-500"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * timerProgress) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="45"
                      cx="50"
                      cy="50"
                      style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
              </svg>
              <span className="absolute text-4xl sm:text-5xl font-bold text-gray-800">{timer}</span>
          </div>
          <div className="relative w-full">
            <button
              onClick={handleNextWord}
              disabled={!currentWord || isPaused}
              className="bg-gray-50 w-full p-6 sm:p-10 rounded-xl mb-4 min-h-[140px] sm:min-h-[160px] flex items-center justify-center transition-colors hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              <h1 className={`${wordFontSize} font-bold transition-all duration-300 ${isPaused ? 'text-gray-400' : 'text-gray-900'}`}>
                  {currentWord || "Слова закончились!"}
              </h1>
            </button>
            {dictionaryEntry && (
              <button 
                  onClick={handleShowDictionary} 
                  className="absolute -top-3 -right-3 sm:top-0 sm:right-0 transform translate-x-1/4 -translate-y-1/4 bg-blue-500 text-white rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg hover:bg-blue-600 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                  aria-label="Показать определение"
              >
                  ?
              </button>
            )}
          </div>
          <div className="w-full flex flex-col gap-3 mt-4">
            <button
              onClick={togglePause}
              className="w-full bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 flex items-center justify-center"
              aria-label={isPaused ? 'Продолжить' : 'Пауза'}
            >
              {isPaused ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}
       {showDictionary && dictionaryEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="dictionary-title">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-pop-in">
                <h2 id="dictionary-title" className="text-2xl sm:text-3xl font-bold mb-4 text-gray-800 capitalize">{currentWord}</h2>
                <ul className="space-y-3 text-left list-disc list-inside mb-6">
                    {dictionaryEntry.map((def, index) => (
                        <li key={index} className="text-base sm:text-lg text-gray-700">{def}</li>
                    ))}
                </ul>
                <button
                    onClick={handleCloseDictionary}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                    Закрыть
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default Gameplay;
