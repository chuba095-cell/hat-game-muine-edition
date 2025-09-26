import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Difficulty, AssignmentMethod, Player, Team } from './types';
import GameSetup from './components/GameSetup';
import TeamAssignment from './components/TeamAssignment';
import Gameplay from './components/Gameplay';
import RoundSummary from './components/RoundSummary';
import TurnReview from './components/TurnReview';
import { fetchWords } from './services/wordService';

const TOTAL_ROUNDS = 3;
const ROUND_DETAILS = [
  { name: 'Объяснение', description: 'Объясняйте слова, не используя однокоренные.' },
  { name: 'Пантомима', description: 'Показывайте слова жестами, без слов.' },
  { name: 'Ассоциации', description: 'Объясняйте слова только одним словом-ассоциацией.' }
];

interface GameData {
  gameState: GameState;
  players: Player[];
  numberOfTeams: number;
  difficulty: Difficulty[];
  wordsPerPlayer: number;
  assignmentMethod: AssignmentMethod;
  teams: Team[];
  wordPool: string[];
  guessedWords: string[];
  currentTurnWords: string[];
  currentTeamIndex: number;
  currentPlayerIndices: number[];
  timerDuration: number;
  currentRound: number;
  wordsForReview: string[];
  lastWordForReview: string | undefined;
  bonusTime: number | null;
  bonusPlayerId: number | null;
}

const initialState: GameData = {
  gameState: GameState.Setup,
  players: [],
  numberOfTeams: 2,
  difficulty: [Difficulty.Easy],
  wordsPerPlayer: 5,
  assignmentMethod: AssignmentMethod.Random,
  teams: [],
  wordPool: [],
  guessedWords: [],
  currentTurnWords: [],
  currentTeamIndex: 0,
  currentPlayerIndices: [],
  timerDuration: 30,
  currentRound: 1,
  wordsForReview: [],
  lastWordForReview: undefined,
  bonusTime: null,
  bonusPlayerId: null,
};


const App: React.FC = () => {
  const [gameData, setGameData] = useState<GameData>(() => {
    try {
      const savedState = localStorage.getItem('hatGameState');
      if (savedState) {
        // Here you could add more sophisticated versioning/migration if the state shape changes in the future
        return JSON.parse(savedState);
      }
    } catch (error) {
      console.error("Could not load state from localStorage", error);
    }
    return initialState;
  });
  
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('hatGameState', JSON.stringify(gameData));
  }, [gameData]);

  const wakeLockSentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Screen Wake Lock API to prevent the screen from turning off.
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockSentinelRef.current = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock is active.');
          wakeLockSentinelRef.current.addEventListener('release', () => {
            console.log('Screen Wake Lock was released.');
            wakeLockSentinelRef.current = null;
          });
        } catch (err) {
          console.error(`Could not acquire wake lock: ${(err as Error).name}, ${(err as Error).message}`);
        }
      } else {
        console.warn('Screen Wake Lock API not supported.');
      }
    };

    const handleVisibilityChange = () => {
      if (wakeLockSentinelRef.current === null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (wakeLockSentinelRef.current) {
        wakeLockSentinelRef.current.release()
          .then(() => {
            wakeLockSentinelRef.current = null;
            console.log('Screen Wake Lock released on component unmount.');
          })
          .catch((err) => {
             console.error(`Could not release wake lock: ${(err as Error).name}, ${(err as Error).message}`);
          });
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const {
    gameState, players, numberOfTeams, difficulty, wordsPerPlayer, assignmentMethod, teams, wordPool,
    guessedWords, currentTurnWords, currentTeamIndex, currentPlayerIndices, timerDuration, currentRound,
    wordsForReview, lastWordForReview, bonusTime, bonusPlayerId
  } = gameData;

  const currentPlayer = teams[currentTeamIndex]?.players[currentPlayerIndices[currentTeamIndex]];

  const resetGame = useCallback(() => {
    localStorage.removeItem('hatGameState');
    setGameData(initialState);
  }, []);
  
  const handleStartSetup = (
    players: Player[], 
    numTeams: number, 
    diff: Difficulty[], 
    wordsCount: number, 
    method: AssignmentMethod,
    timer: number,
  ) => {
    setGameData(prev => ({
      ...prev,
      players,
      numberOfTeams: numTeams,
      difficulty: diff,
      wordsPerPlayer: wordsCount,
      assignmentMethod: method,
      timerDuration: timer,
      gameState: GameState.AssigningTeams,
    }));
  };
  
  const handleTeamsAssigned = useCallback((assignedTeams: Team[]) => {
    setGameData(prev => ({
      ...prev,
      teams: assignedTeams,
      currentPlayerIndices: new Array(assignedTeams.length).fill(0),
      gameState: GameState.TeamsSummary,
    }));
  }, []);

  const handleGoBack = () => {
    if (gameState === GameState.AssigningTeams) {
        setGameData(prev => ({...prev, gameState: GameState.Setup}));
    } else if (gameState === GameState.TeamsSummary) {
        setGameData(prev => ({
          ...prev,
          teams: [],
          gameState: GameState.Setup
        }));
    }
  };
  
  const handleConfirmTeams = () => {
    setGameData(prev => ({...prev, gameState: GameState.GeneratingWords}));
    
    const totalWords = players.length * wordsPerPlayer;
    const selectedDifficulties = difficulty;
    const numDifficulties = selectedDifficulties.length;

    if (numDifficulties === 0) {
        console.error("No difficulty selected.");
        setGameData(prev => ({...prev, gameState: GameState.TeamsSummary}));
        return;
    }

    const wordsPerDifficulty = Math.floor(totalWords / numDifficulties);
    let remainder = totalWords % numDifficulties;

    const allWords = selectedDifficulties.flatMap(diff => {
        const count = wordsPerDifficulty + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        return fetchWords(diff, count);
    });

    const shuffledWords = allWords.sort(() => Math.random() - 0.5);
    
    // Use a small timeout to make the loading spinner visible for a better user experience
    setTimeout(() => {
      setGameData(prev => ({
        ...prev,
        wordPool: shuffledWords,
        gameState: GameState.PlayerTurn,
      }));
    }, 500);
  };
  
  const handleTurnFinish = (wordsGuessedThisTurn: string[], lastWord: string | undefined, remainingTime?: number) => {
    const updates: Partial<GameData> = {
      wordsForReview: wordsGuessedThisTurn,
      lastWordForReview: lastWord,
      gameState: GameState.TurnReview
    };

    if (bonusTime) {
      updates.bonusTime = null;
      updates.bonusPlayerId = null;
    }
    
    if (remainingTime && remainingTime > 0 && currentPlayer) {
      updates.bonusTime = remainingTime;
      updates.bonusPlayerId = currentPlayer.id;
    }

    setGameData(prev => ({...prev, ...updates}));
  };

  const handleTurnEnd = (wordsGuessedThisTurn: string[]) => {
    const wordsCount = wordsGuessedThisTurn.length;
    const allGuessed = [...guessedWords, ...wordsGuessedThisTurn];

    const updatedTeams = teams.map((team, teamIdx) => {
      if (teamIdx === currentTeamIndex) {
        const updatedPlayers = team.players.map((player, playerIdx) => {
          if (playerIdx === currentPlayerIndices[currentTeamIndex]) {
            return { ...player, score: player.score + wordsCount };
          }
          return player;
        });
        return {
          ...team,
          score: team.score + wordsCount,
          players: updatedPlayers,
        };
      }
      return team;
    });

    setGameData(prev => ({
      ...prev,
      teams: updatedTeams,
      guessedWords: allGuessed,
      currentTurnWords: wordsGuessedThisTurn,
      gameState: GameState.TurnSummary,
    }));
  };

  const handleReturnToReview = () => {
    setGameData(prev => {
      const wordsToRevert = prev.currentTurnWords;
      const wordsCount = wordsToRevert.length;

      const updatedTeams = prev.teams.map((team, teamIdx) => {
        if (teamIdx === prev.currentTeamIndex) {
          const updatedPlayers = team.players.map((player, playerIdx) => {
            if (playerIdx === prev.currentPlayerIndices[prev.currentTeamIndex]) {
              return { ...player, score: player.score - wordsCount };
            }
            return player;
          });
          return {
            ...team,
            score: team.score - wordsCount,
            players: updatedPlayers,
          };
        }
        return team;
      });

      const previousGuessedWords = prev.guessedWords.filter(word => !wordsToRevert.includes(word));

      return {
        ...prev,
        teams: updatedTeams,
        guessedWords: previousGuessedWords,
        currentTurnWords: [],
        gameState: GameState.TurnReview,
      };
    });
  };
  
  const handleNextPlayer = () => {
      if (wordPool.length > 0 && guessedWords.length >= wordPool.length) {
        if (currentRound < TOTAL_ROUNDS) {
          setGameData(prev => ({ ...prev, gameState: GameState.EndOfRoundSummary }));
        } else {
          setGameData(prev => ({ ...prev, gameState: GameState.RoundSummary }));
        }
        return;
      }

      const nextTeamIndex = (currentTeamIndex + 1) % teams.length;
      const nextPlayerIndices = [...currentPlayerIndices];
      nextPlayerIndices[currentTeamIndex] = (nextPlayerIndices[currentTeamIndex] + 1) % teams[currentTeamIndex].players.length;
      
      setGameData(prev => ({
        ...prev,
        wordPool: [...prev.wordPool].sort(() => Math.random() - 0.5),
        currentTeamIndex: nextTeamIndex,
        currentPlayerIndices: nextPlayerIndices,
        currentTurnWords: [],
        gameState: GameState.PlayerTurn,
      }));
  };

  const handleStartNextRound = () => {
    let nextTeamIndex = -1;
    let nextPlayerIndices = [...currentPlayerIndices];
    
    if (bonusPlayerId) {
        const bonusPlayerTeamIndex = teams.findIndex(team => team.players.some(p => p.id === bonusPlayerId));
        if (bonusPlayerTeamIndex !== -1) {
            const bonusPlayerIndexInTeam = teams[bonusPlayerTeamIndex].players.findIndex(p => p.id === bonusPlayerId);
            nextPlayerIndices[bonusPlayerTeamIndex] = bonusPlayerIndexInTeam;
            nextTeamIndex = bonusPlayerTeamIndex;
        }
    } 

    if (nextTeamIndex === -1) {
      // Fallback or normal rotation
      nextTeamIndex = (currentTeamIndex + 1) % teams.length;
      nextPlayerIndices[currentTeamIndex] = (nextPlayerIndices[currentTeamIndex] + 1) % teams[currentTeamIndex].players.length;
    }

    setGameData(prev => ({
      ...prev,
      currentRound: prev.currentRound + 1,
      guessedWords: [],
      currentTurnWords: [],
      wordPool: [...prev.wordPool].sort(() => Math.random() - 0.5),
      currentTeamIndex: nextTeamIndex,
      currentPlayerIndices: nextPlayerIndices,
      gameState: GameState.PlayerTurn,
    }));
  };

  const handleEndGameEarly = () => {
    setGameData(prev => ({...prev, gameState: GameState.RoundSummary}));
  };

  const currentTeam = teams[currentTeamIndex];
  const currentRoundDetails = ROUND_DETAILS[currentRound - 1];

  const renderContent = () => {
    switch (gameState) {
      case GameState.Setup:
        return <GameSetup onStart={handleStartSetup} />;
      case GameState.AssigningTeams:
        return <TeamAssignment players={players} numberOfTeams={numberOfTeams} method={assignmentMethod} onComplete={handleTeamsAssigned} onBack={handleGoBack} />;
      case GameState.TeamsSummary:
        return (
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto animate-fade-in">
                <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-gray-800">Команды сформированы!</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {teams.map((team, index) => (
                        <div key={index} className={`p-4 ${team.color.bgColor} rounded-lg border ${team.color.borderColor}`}>
                            <h3 className={`font-bold text-xl ${team.color.textColor} mb-3`}>{team.name}</h3>
                            <ul className="space-y-2">
                                {team.players.map(player => (
                                    <li key={player.id} className={`text-lg font-medium ${team.color.textColor}`}>
                                        {player.name}
                                    </li>
                                ))}
                                {team.players.length === 0 && <li className="text-gray-500 italic">Нет игроков</li>}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="flex flex-col md:flex-row gap-4 mt-8">
                    <button 
                        onClick={handleGoBack} 
                        className="w-full bg-gray-200 text-gray-800 font-bold py-3 sm:py-4 px-6 text-lg sm:text-xl rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Назад
                    </button>
                    <button 
                        onClick={handleConfirmTeams} 
                        className="w-full bg-green-500 text-white font-bold py-3 sm:py-4 px-6 text-lg sm:text-xl rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        Продолжить
                    </button>
                </div>
            </div>
        );
      case GameState.GeneratingWords:
          return (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin-fast border-indigo-500"></div>
                  <h2 className="text-2xl font-semibold text-gray-700">Готовим слова...</h2>
              </div>
          )
      case GameState.PlayerTurn:
        const durationForTurn = bonusTime ?? timerDuration;
        return <Gameplay key={`${currentTeamIndex}-${currentPlayerIndices[currentTeamIndex]}-${currentRound}-${durationForTurn}`} timerDuration={durationForTurn} wordPool={wordPool.filter(w => !guessedWords.includes(w))} onTurnFinish={handleTurnFinish} currentPlayer={currentPlayer} currentTeam={currentTeam} roundName={currentRoundDetails.name} roundDescription={currentRoundDetails.description} />;
      case GameState.TurnReview:
        return <TurnReview initialGuessedWords={wordsForReview} lastWord={lastWordForReview} onConfirm={handleTurnEnd} />;
      case GameState.TurnSummary:
        const isKirill = currentPlayer?.name && ['кирилл', 'кирюша'].includes(currentPlayer.name.toLowerCase());
        return (
            <div className="text-center p-6 sm:p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto">
                {isKirill ? (
                    <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Отличная работа, {currentPlayer?.name}!<br />Ты просто ПИСЯКОРОЛЕВА!</h2>
                        <p className="text-base sm:text-lg mb-6 text-gray-600">Слова, которые ты угадал(а):</p>
                    </>
                ) : (
                    <>
                        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Отличная работа, {currentPlayer?.name}!</h2>
                        <p className="text-base sm:text-lg mb-6 text-gray-600">Слова, которые ты объяснил(а):</p>
                    </>
                )}
                <div className="flex flex-wrap justify-center gap-2 mb-8 p-2 bg-gray-50 rounded-md">
                    {currentTurnWords.length > 0 ? currentTurnWords.map((word, index) => <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">{word}</span>) : <p className="text-gray-500">Не было угадано ни одного слова.</p>}
                </div>
                <div className="flex flex-col gap-3 mt-8">
                    <button onClick={handleNextPlayer} className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                        Следующий игрок
                    </button>
                    <button onClick={handleReturnToReview} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">
                        Назад к проверке
                    </button>
                </div>
            </div>
        );
      case GameState.EndOfRoundSummary:
          return <RoundSummary teams={teams} onNewGame={handleStartNextRound} onEndGame={handleEndGameEarly} isFinal={false} currentRound={currentRound} roundName={currentRoundDetails.name} />;
      case GameState.RoundSummary:
          return <RoundSummary teams={teams} onNewGame={resetGame} isFinal={true} />;
      default:
        return <div>Что-то пошло не так.</div>;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-2 sm:p-4">
       <div className="w-full max-w-4xl mx-auto relative">
         {gameState !== GameState.Setup && gameState !== GameState.TeamsSummary && gameState !== GameState.GeneratingWords && (
            <button
                onClick={() => setShowResetConfirmModal(true)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                aria-label="Завершить игру"
            >
                <span className="text-2xl font-bold leading-none -mt-1">&times;</span>
            </button>
         )}
         {renderContent()}
      </div>
      
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4 animate-pop-in">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Завершить игру?</h2>
                <p className="text-gray-600 mb-8">Вы точно хотите завершить текущую игру? Весь прогресс будет потерян.</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setShowResetConfirmModal(false)}
                        className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={() => {
                            resetGame();
                            setShowResetConfirmModal(false);
                        }}
                        className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Завершить
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;