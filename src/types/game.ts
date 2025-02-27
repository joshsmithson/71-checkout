// src/types/game.ts

export type GameType = "301" | "501";

export type PlayerStatistics = {
  player_name: string;
  games_played: number;
  games_won: number;
  total_score: number;
  highest_checkout: number;
  average_score?: number;
};

export type Player = {
  name: string;
  score: number;
  throws: number[];
  statistics: PlayerStatistics;
};

export const createInitialPlayer = (name: string = "Player 1", gameType: GameType = "301"): Player => ({
  name,
  score: gameType === "301" ? 301 : 501,
  throws: [],
  statistics: {
    player_name: name,
    games_played: 0,
    games_won: 0,
    total_score: 0,
    highest_checkout: 0,
    average_score: 0
  }
});