import React, { useState, useEffect } from 'react';
import { Player, Team, AssignmentMethod, TEAM_COLORS } from '../types';

interface TeamAssignmentProps {
  players: Player[];
  numberOfTeams: number;
  method: AssignmentMethod;
  onComplete: (teams: Team[]) => void;
  onBack: () => void;
}

const TeamAssignment: React.FC<TeamAssignmentProps> = ({ players, numberOfTeams, method, onComplete, onBack }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [unassignedPlayers, setUnassignedPlayers] = useState<Player[]>([...players]);
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);

  useEffect(() => {
    const initialTeams = Array.from({ length: numberOfTeams }, (_, i) => {
      const color = TEAM_COLORS[i % TEAM_COLORS.length];
      return {
        name: `Команда ${color.name}`,
        players: [],
        score: 0,
        color: color,
      };
    });
    
    if (method === AssignmentMethod.Random) {
      const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
      shuffledPlayers.forEach((player, index) => {
        initialTeams[index % numberOfTeams].players.push(player);
      });
      onComplete(initialTeams);
    } else {
      setTeams(initialTeams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const assignPlayerToTeam = (player: Player, teamIndex: number) => {
    setUnassignedPlayers(unassignedPlayers.filter(p => p.id !== player.id));
    const newTeams = [...teams];
    newTeams[teamIndex].players.push(player);
    setTeams(newTeams);
  };
  
  const unassignPlayerFromTeam = (player: Player, teamIndex: number) => {
    setUnassignedPlayers([...unassignedPlayers, player]);
    const newTeams = [...teams];
    newTeams[teamIndex].players = newTeams[teamIndex].players.filter(p => p.id !== player.id);
    setTeams(newTeams);
  };


  if (method === AssignmentMethod.Random) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin-fast border-indigo-500"></div>
        <h2 className="text-2xl font-semibold text-gray-700">Распределяем игроков...</h2>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Распределение по командам</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Нераспределенные игроки</h2>
        <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg min-h-[60px]">
          {unassignedPlayers.length > 0 ? (
            unassignedPlayers.map(player => (
              <button key={player.id} onClick={() => assignPlayerToTeam(player, activeTeamIndex)} className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full font-medium hover:bg-indigo-200 transition-colors">
                {player.name}
              </button>
            ))
          ) : (
            <p className="text-gray-500">Все игроки распределены!</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team, index) => (
          <div key={index} onClick={() => setActiveTeamIndex(index)} className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${activeTeamIndex === index ? `${team.color.bgColor} ${team.color.borderColor}` : 'bg-gray-100 border-transparent'}`}>
            <h3 className={`font-bold text-lg ${team.color.textColor} mb-3`}>{team.name}</h3>
            <div className="flex flex-col gap-2 min-h-[100px]">
              {team.players.map(player => (
                <div key={player.id} onClick={(e) => {e.stopPropagation(); unassignPlayerFromTeam(player, index);}} className="flex items-center justify-between bg-white rounded-md p-2 shadow-sm cursor-pointer hover:bg-red-50">
                   <span className={team.color.textColor}>{player.name}</span>
                   <span className="text-red-400 text-xs">убрать</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex flex-col md:flex-row gap-4">
        <button 
            onClick={onBack}
            className="w-full bg-gray-200 text-gray-800 font-bold py-4 px-6 text-xl rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
            Назад
        </button>
        <button 
          onClick={() => onComplete(teams)} 
          disabled={unassignedPlayers.length > 0} 
          className="w-full bg-green-500 text-white font-bold py-4 px-6 text-xl rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Подтвердить команды
        </button>
      </div>
    </div>
  );
};

export default TeamAssignment;