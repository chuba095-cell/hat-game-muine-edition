// FIX: Moved all component logic, including state hooks and helper functions, inside the GameSetup functional component to resolve scope-related errors and ensure proper component structure.
import React, { useState, useEffect } from 'react';
import { Difficulty, AssignmentMethod, Player } from '../types';
import { getWordCounts } from '../services/wordService';

interface GameSetupProps {
  onStart: (
    players: Player[], 
    numTeams: number, 
    difficulty: Difficulty[], 
    wordsPerPlayer: number, 
    assignmentMethod: AssignmentMethod,
    timerDuration: number,
  ) => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ onStart }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([Difficulty.Easy]);
  const [wordsPerPlayer, setWordsPerPlayer] = useState(5);
  const [assignmentMethod, setAssignmentMethod] = useState<AssignmentMethod>(AssignmentMethod.Random);
  const [timerDuration, setTimerDuration] = useState(30);
  const [recentPlayers, setRecentPlayers] = useState<string[]>([]);
  const wordCounts = getWordCounts();

  const [teamsInputValue, setTeamsInputValue] = useState(numberOfTeams.toString());
  const [wordsInputValue, setWordsInputValue] = useState(wordsPerPlayer.toString());

  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem('hatGameRecentPlayers');
      if (savedPlayers) {
        setRecentPlayers(JSON.parse(savedPlayers));
      }
    } catch (error) {
      console.error("Could not load recent players from localStorage", error);
    }
  }, []);

  const addPlayer = () => {
    const trimmedName = playerName.trim();
    if (trimmedName) {
      const isDuplicate = players.some(player => player.name.toLowerCase() === trimmedName.toLowerCase());
      if (isDuplicate) {
        alert(`Игрок с именем "${trimmedName}" уже существует. Пожалуйста, введите другое имя.`);
        return;
      }
      setPlayers([...players, {id: Date.now(), name: trimmedName, score: 0}]);
      setPlayerName('');
    }
  };
  
  const quickAddPlayer = (name: string) => {
    const isDuplicate = players.some(player => player.name.toLowerCase() === name.toLowerCase());
    if (!isDuplicate) {
        setPlayers(prevPlayers => [...prevPlayers, { id: Date.now(), name, score: 0 }]);
    }
  };

  const removePlayer = (idToRemove: number) => {
    setPlayers(players.filter(p => p.id !== idToRemove));
  };

  const toggleDifficulty = (d: Difficulty) => {
    setSelectedDifficulties(prev => {
      const isSelected = prev.includes(d);
      if (isSelected) {
        if (prev.length === 1) return prev;
        return prev.filter(item => item !== d);
      } else {
        return [...prev, d];
      }
    });
  };

  const handleStart = () => {
    if (players.length < 2 || players.length < numberOfTeams) {
        alert("Нужно как минимум 2 игрока и количество игроков должно быть не меньше количества команд.");
        return;
    }
    if (selectedDifficulties.length === 0) {
        alert("Пожалуйста, выберите хотя бы один уровень сложности.");
        return;
    }
    
    // Update and save recent players list
    const newNames = players.map(p => p.name);
    const combined = [...newNames, ...recentPlayers];
    
    const uniqueNamesMap = new Map<string, string>();
    combined.forEach(name => {
        if (!uniqueNamesMap.has(name.toLowerCase())) {
            uniqueNamesMap.set(name.toLowerCase(), name);
        }
    });

    const finalRecentPlayers = Array.from(uniqueNamesMap.values()).slice(0, 15);
    localStorage.setItem('hatGameRecentPlayers', JSON.stringify(finalRecentPlayers));

    onStart(players, numberOfTeams, selectedDifficulties, wordsPerPlayer, assignmentMethod, timerDuration);
  };
  
  const availableRecentPlayers = recentPlayers.filter(
    recentName => !players.some(p => p.name.toLowerCase() === recentName.toLowerCase())
  );
  
  const handleTeamsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTeamsInputValue(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setNumberOfTeams(num);
    }
  };

  const handleTeamsBlur = () => {
    const num = parseInt(teamsInputValue, 10);
    if (isNaN(num) || num < 2) {
      setNumberOfTeams(2);
      setTeamsInputValue('2');
    }
  };

  const handleWordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWordsInputValue(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setWordsPerPlayer(num);
    }
  };

  const handleWordsBlur = () => {
    const num = parseInt(wordsInputValue, 10);
    if (isNaN(num) || num < 1) {
      setWordsPerPlayer(1);
      setWordsInputValue('1');
    }
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-2xl mx-auto">
      <h1 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-gray-800">Игра в Шляпу</h1>

      {/* Players Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">1. Добавьте игроков</h2>
        
        {availableRecentPlayers.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">Быстрое добавление:</p>
            <div className="flex flex-wrap gap-2">
              {availableRecentPlayers.map(name => (
                <button
                  key={name}
                  onClick={() => quickAddPlayer(name)}
                  className="bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm font-medium hover:bg-indigo-200 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="Имя игрока"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={addPlayer} className="bg-indigo-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-indigo-700 transition-colors">
            Добавить
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {players.map((player) => (
            <div key={player.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm font-medium text-gray-800">
              <span>{player.name}</span>
              <button onClick={() => removePlayer(player.id)} className="ml-2 text-red-500 hover:text-red-700 font-bold">
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Teams Section */}
        <div>
          <h2 className="text-xl font-semibold mb-3 text-gray-700">2. Количество команд</h2>
          <input
            type="number"
            value={teamsInputValue}
            onChange={handleTeamsChange}
            onBlur={handleTeamsBlur}
            min="2"
            max={players.length > 1 ? players.length : 10}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Words per Player Section */}
        <div>
            <h2 className="text-xl font-semibold mb-3 text-gray-700">3. Слов на игрока</h2>
            <input
                type="number"
                value={wordsInputValue}
                onChange={handleWordsChange}
                onBlur={handleWordsBlur}
                min="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">4. Время таймера (сек)</h2>
        <div className="flex gap-4 rounded-lg bg-gray-100 p-1">
          {[30, 45, 60].map(time => (
            <button key={time} onClick={() => setTimerDuration(time)} className={`w-full p-2 rounded-md font-medium transition-colors ${timerDuration === time ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment Method Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">5. Распределение по командам</h2>
        <div className="flex gap-4 rounded-lg bg-gray-100 p-1">
          <button onClick={() => setAssignmentMethod(AssignmentMethod.Random)} className={`w-full p-2 rounded-md font-medium transition-colors ${assignmentMethod === AssignmentMethod.Random ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            Случайно
          </button>
          <button onClick={() => setAssignmentMethod(AssignmentMethod.Manual)} className={`w-full p-2 rounded-md font-medium transition-colors ${assignmentMethod === AssignmentMethod.Manual ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            Вручную
          </button>
        </div>
      </div>
      
      {/* Difficulty Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">6. Сложность слов</h2>
        <p className="text-sm text-gray-500 mb-2">Можно выбрать несколько.</p>
        <div className="flex flex-col sm:flex-row gap-4 rounded-lg bg-gray-100 p-2">
          {Object.values(Difficulty).map((d) => (
            <div key={d} className="w-full flex flex-col items-center gap-1">
              <button onClick={() => toggleDifficulty(d)} className={`w-full p-2 rounded-md font-medium transition-all duration-200 capitalize ${selectedDifficulties.includes(d) ? 'bg-indigo-600 text-white shadow transform scale-105' : 'text-gray-600 hover:bg-gray-200'}`}>
                {d}
              </button>
              <span className="text-xs text-gray-500">{wordCounts[d]} слов</span>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleStart} className="w-full bg-green-500 text-white font-bold py-3 sm:py-4 px-6 text-lg sm:text-xl rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
        Начать игру
      </button>
    </div>
  );
};

export default GameSetup;
