import React, { useState } from 'react';
import { Team, Player } from '../types';

interface RoundSummaryProps {
  teams: Team[];
  onNewGame: () => void;
  isFinal: boolean;
  onEndGame?: () => void;
  currentRound?: number;
  roundName?: string;
}

const TrophyIcon: React.FC<{className: string}> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.0001 3.29297L13.886 6.58245C13.951 6.70228 14.072 6.78693 14.2059 6.80934L17.8058 7.35123C18.2333 7.4121 18.4013 7.92556 18.1029 8.21402L15.4241 10.7934C15.3204 10.8934 15.2713 11.0374 15.2918 11.1786L15.9015 14.7578C15.9687 15.1834 15.5398 15.4851 15.1485 15.2764L11.9472 13.5599C11.8267 13.4947 11.6833 13.4947 11.5627 13.5599L8.36149 15.2764C7.97022 15.4851 7.54133 15.1834 7.6085 14.7578L8.21817 11.1786C8.23869 11.0374 8.18962 10.8934 8.08591 10.7934L5.40706 8.21402C5.10869 7.92556 5.27671 7.4121 5.70422 7.35123L9.30409 6.80934C9.43801 6.78693 9.55899 6.70228 9.62399 6.58245L11.51 3.29297C11.6931 2.94662 12.2169 2.94662 12.4 3.29297H12.0001Z" />
    <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 18V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const RoundSummary: React.FC<RoundSummaryProps> = ({ teams, onNewGame, isFinal, onEndGame, currentRound, roundName }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const maxTeamScore = sortedTeams.length > 0 ? sortedTeams[0].score : 0;

  // Find all players with the highest score
  const allPlayers = teams.flatMap(team => team.players);
  const maxPlayerScore = allPlayers.reduce((max, p) => p.score > max ? p.score : max, 0);
  const bestPlayers = maxPlayerScore > 0 ? allPlayers.filter(p => p.score === maxPlayerScore) : [];


  const handleEndGameClick = () => {
    setShowConfirmModal(true);
  };

  const confirmEndGame = () => {
    if (onEndGame) {
      onEndGame();
    }
    setShowConfirmModal(false);
  };

  const getPlayerTeamColor = (player: Player) => {
    const playerTeam = teams.find(team => team.players.some(p => p.id === player.id));
    return playerTeam ? playerTeam.color.textColor : 'text-gray-800';
  };

  return (
    <>
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-800">
          {isFinal ? 'Игра окончена!' : `Раунд ${currentRound}: ${roundName} завершен!`}
        </h1>
        <p className="text-base sm:text-lg text-gray-500 mb-8">
          {isFinal ? 'Итоговые результаты:' : 'Текущие очки:'}
        </p>

        <div className="space-y-4">
          {sortedTeams.map((team, index) => {
            const isWinner = isFinal && team.score === maxTeamScore && maxTeamScore > 0;
            return (
              <div key={team.name} className={`flex items-center p-3 sm:p-4 rounded-lg shadow-sm ${isWinner ? team.color.bgColor : 'bg-gray-50'}`}>
                <span className={`text-2xl sm:text-3xl font-bold w-10 sm:w-12 ${index < 3 ? 'text-gray-700' : 'text-gray-500'}`}>{index + 1}</span>
                <div className="text-left flex-grow">
                  <p className={`text-lg sm:text-xl font-semibold ${team.color.textColor}`}>{team.name}</p>
                  <p className={`text-xs sm:text-sm ${team.color.textColor} opacity-75`}>{team.players.map(p => p.name).join(', ')}</p>
                </div>
                {isWinner && <TrophyIcon className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-400" />}
                <span className="text-xl sm:text-2xl font-bold text-indigo-600 w-16 sm:w-20 text-right">{team.score} очков</span>
              </div>
            );
          })}
        </div>

        {isFinal && bestPlayers.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-3">
              {bestPlayers.length > 1 ? 'Лучшие игроки' : 'Лучший игрок'}
            </h2>
             <div className="space-y-3">
              {bestPlayers.map(player => (
                <div key={player.id} className="bg-amber-100 p-3 sm:p-4 rounded-lg flex items-center justify-center gap-4 shadow">
                  <TrophyIcon className="w-6 h-6 sm:w-8 sm:h-8 text-amber-500" />
                  <p className={`text-xl sm:text-2xl font-bold ${getPlayerTeamColor(player)}`}>{player.name}</p>
                  <span className="text-xl sm:text-2xl font-bold text-amber-700">{player.score} слов</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isFinal ? (
          <button
            onClick={onNewGame}
            className="mt-10 w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Новая игра
          </button>
        ) : (
          <div className="mt-10 flex flex-col gap-4">
              <button
                  onClick={onNewGame}
                  className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                  Следующий раунд
              </button>
              <button
                  onClick={handleEndGameClick}
                  className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                  Завершить игру
              </button>
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm mx-4 animate-pop-in">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Подтверждение</h2>
            <p className="text-gray-600 mb-8">Вы уверены, что хотите досрочно завершить игру? Текущие очки станут финальными.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              >
                Отмена
              </button>
              <button
                onClick={confirmEndGame}
                className="flex-1 bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RoundSummary;