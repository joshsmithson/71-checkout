import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

type PlayerStatistics = {
  player_name: string;
  games_played: number;
  games_won: number;
  total_score: number;
  highest_checkout: number;
  average_score?: number;
};

type StatCardProps = {
  title: string;
  value: string | number;
};

const StatCard = ({ title, value }: StatCardProps) => (
  <Card className="bg-gray-800 text-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

interface PlayerStatsDisplayProps {
  stats: PlayerStatistics;
  showTitle?: boolean;
  className?: string;
}

const PlayerStatsDisplay = ({ stats, showTitle = true, className = '' }: PlayerStatsDisplayProps) => {
  const winRate = ((stats.games_won / stats.games_played) * 100 || 0).toFixed(2);
  const avgScore = stats.average_score || (stats.total_score / stats.games_played || 0).toFixed(2);

  return (
    <div className={`space-y-4 ${className}`}>
      {showTitle && (
        <h3 className="text-lg font-medium mb-2">{stats.player_name}</h3>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard title="Games Played" value={stats.games_played} />
        <StatCard title="Games Won" value={stats.games_won} />
        <StatCard title="Win Rate" value={`${winRate}%`} />
        <StatCard title="Highest Checkout" value={stats.highest_checkout} />
        <StatCard title="Average Score" value={avgScore} />
      </div>
    </div>
  );
};

export default PlayerStatsDisplay;