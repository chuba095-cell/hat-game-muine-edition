// FIX: Removed self-import of GameState to resolve conflict with local declaration.
export const TEAM_COLORS = [
  { name: 'Красных', textColor: 'text-red-600', bgColor: 'bg-red-100', borderColor: 'border-red-500' },
  { name: 'Синих', textColor: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' },
  { name: 'Зеленых', textColor: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500' },
  { name: 'Желтых', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' },
  { name: 'Фиолетовых', textColor: 'text-purple-600', bgColor: 'bg-purple-100', borderColor: 'border-purple-500' },
  { name: 'Оранжевых', textColor: 'text-orange-600', bgColor: 'bg-orange-100', borderColor: 'border-orange-500' },
  { name: 'Розовых', textColor: 'text-pink-600', bgColor: 'bg-pink-100', borderColor: 'border-pink-500' },
  { name: 'Бирюзовых', textColor: 'text-teal-600', bgColor: 'bg-teal-100', borderColor: 'border-teal-500' },
];

export enum GameState {
  Setup,
  AssigningTeams,
  TeamsSummary,
  GeneratingWords,
  PlayerTurn,
  TurnReview,
  TurnSummary,
  EndOfRoundSummary,
  RoundSummary,
}

export enum Difficulty {
  Easy = "легкий",
  Medium = "средний",
  Hard = "сложный",
}

export enum AssignmentMethod {
  Random,
  Manual,
}

export interface Player {
  id: number;
  name: string;
  score: number;
}

export interface TeamColor {
  name: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export interface Team {
  name: string;
  players: Player[];
  score: number;
  color: TeamColor;
}