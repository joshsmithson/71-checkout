// src/app/profile/page.tsx
"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import PlayerStatsDisplay from "@/components/player-stats-display"
import DetailedGameStats from "@/components/detailed-game-statistics"
import { fetchDetailedGameHistory } from "@/lib/gameSessionUtils"
import type { PlayerStatistics } from "@/types/game"
import type { GameSession } from "@/lib/gameSessionUtils"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [userStats, setUserStats] = useState<PlayerStatistics | null>(null)
  const [friendStats, setFriendStats] = useState<PlayerStatistics[]>([])
  const [gameHistory, setGameHistory] = useState<GameSession[]>([])
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchUserAndStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
    
      if (!user) {
        router.push("/login")
        return
      }
    
      setUser(user)
    
      // Fetch user statistics - Modified to handle no results properly
      const { data: userStatsData, error: userStatsError } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("user_id", user.id)
        .eq("player_name", user.email)
    
      if (userStatsError) {
        console.error("Error fetching user statistics:", userStatsError)
        toast.error("Failed to fetch user statistics")
      } else {
        // If there's no data, create an initial statistics record
        if (!userStatsData || userStatsData.length === 0) {
          const initialStats = {
            user_id: user.id,
            player_name: user.email,
            games_played: 0,
            games_won: 0,
            total_score: 0,
            highest_checkout: 0,
            average_score: 0
          }
    
          const { data: newStats, error: createError } = await supabase
            .from("player_statistics")
            .insert(initialStats)
            .select()
            .single()
    
          if (createError) {
            console.error("Error creating initial statistics:", createError)
            toast.error("Failed to create statistics")
          } else {
            setUserStats(newStats)
          }
        } else {
          setUserStats(userStatsData[0])
        }
      }

      // Fetch friend statistics
      const { data: friendStatsData, error: friendStatsError } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("user_id", user.id)
        .neq("player_name", user.email)

      if (friendStatsError) {
        console.error("Error fetching friend statistics:", friendStatsError)
        toast.error("Failed to fetch friend statistics")
      } else {
        setFriendStats(friendStatsData || [])
      }

      // Fetch game history
      try {
        const sessions = await fetchDetailedGameHistory(user.id)
        setGameHistory(sessions)
      } catch (error) {
        console.error("Error fetching game history:", error)
        toast.error("Failed to fetch game history")
      }
    }

    fetchUserAndStats()
  }, [supabase, router])

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Button onClick={() => router.push("/game")}>Back to Game</Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Game History</TabsTrigger>
          <TabsTrigger value="friends">Local Players</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-gray-800">
            <CardHeader>
              <CardTitle>Your Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {userStats ? (
                <PlayerStatsDisplay stats={userStats} showTitle={false} />
              ) : (
                <p className="text-gray-400">No statistics available. Play a game to see your stats!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-gray-800">
              <CardHeader>
                <CardTitle>Recent Games</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[600px] overflow-y-auto">
                <div className="space-y-2">
                  {gameHistory.map((game) => (
                    <Button
                      key={game.id}
                      variant="ghost"
                      className={`w-full text-left justify-start ${
                        selectedGame?.id === game.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedGame(game)}
                    >
                      <div>
                        <p className="font-medium">{game.game_type} - {new Date(game.created_at).toLocaleDateString()}</p>
                        <p className="text-sm text-gray-400">Winner: {game.winner_name}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {selectedGame && <DetailedGameStats session={selectedGame} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="friends" className="space-y-6">
          {friendStats.length > 0 ? (
            <div className="space-y-6">
              {friendStats.map((stats) => (
                <Card key={stats.player_name} className="bg-gray-800">
                  <CardContent className="pt-6">
                    <PlayerStatsDisplay 
                      stats={stats}
                      className="border-t border-gray-700 pt-4"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800">
              <CardContent className="p-6">
                <p className="text-gray-400">No local player statistics available. Add players to your games!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}