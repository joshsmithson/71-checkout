// src/components/detailed-game-stats.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { GameSession } from '@/lib/gameSessionUtils';

interface DetailedGameStatsProps {
  session: GameSession;
}

const DetailedGameStats: React.FC<DetailedGameStatsProps> = ({ session }) => {
  // Handle cases where arrays might be empty
  const turns = session.game_session_turns || [];
  const players = session.game_session_players || [];

  // Calculate score progression for each player
  const scoreProgression = turns.reduce((acc, turn) => {
    if (!acc[turn.player_name]) {
      acc[turn.player_name] = [];
    }
    
    acc[turn.player_name].push({
      turn: turn.turn_number,
      score: turn.score_after,
      throwTotal: turn.throws.reduce((sum, t) => sum + t, 0)
    });
    
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate statistics
  const playerStats = players.map(player => {
    const playerTurns = turns.filter(
      turn => turn.player_name === player.player_name
    );
    
    const totalThrows = playerTurns.reduce(
      (sum, turn) => sum + turn.throws.reduce((s, t) => s + t, 0),
      0
    );
    
    const bustCount = playerTurns.filter(turn => turn.is_bust).length;
    const avgThrow = totalThrows / (playerTurns.length || 1);
    
    return {
      player_name: player.player_name,
      turns_taken: playerTurns.length,
      busts: bustCount,
      avg_throw: avgThrow.toFixed(2),
      final_score: player.final_score ?? session.starting_score
    };
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>Game Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400">Game Type</p>
              <p className="text-lg font-bold">{session.game_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Winner</p>
              <p className="text-lg font-bold">{session.winner_name || 'In Progress'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Date</p>
              <p className="text-lg">{new Date(session.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Duration</p>
              <p className="text-lg">
                {session.completed_at 
                  ? Math.round((new Date(session.completed_at).getTime() - new Date(session.created_at).getTime()) / 60000)
                  : 'In Progress'} minutes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>Score Progression</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart>
                {Object.entries(scoreProgression).map(([player, data]) => (
                  <Line
                    key={player}
                    data={data}
                    dataKey="score"
                    name={player}
                    stroke={`hsl(${Math.random() * 360}, 70%, 50%)`}
                    dot={false}
                  />
                ))}
                <XAxis dataKey="turn" />
                <YAxis />
                <Tooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 text-white">
        <CardHeader>
          <CardTitle>Player Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {playerStats.map(stat => (
              <div key={stat.player_name} className="p-4 bg-gray-700 rounded-lg">
                <h3 className="font-bold mb-2">{stat.player_name}</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Turns Taken</p>
                    <p className="font-bold">{stat.turns_taken}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Busts</p>
                    <p className="font-bold">{stat.busts}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Per Turn</p>
                    <p className="font-bold">{stat.avg_throw}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Final Score</p>
                    <p className="font-bold">{stat.final_score}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedGameStats;