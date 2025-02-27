"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type PlayerStatistics = {
  player_name: string
  games_played: number
  games_won: number
  total_score: number
  highest_checkout: number
  average_score: number
}

export default function AccountPage() {
  const [userStats, setUserStats] = useState<PlayerStatistics | null>(null)
  const [friendStats, setFriendStats] = useState<PlayerStatistics[]>([])
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      // Fetch user statistics
      const { data: userStatsData, error: userStatsError } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (userStatsError) {
        toast.error("Failed to fetch user statistics")
      } else {
        setUserStats(userStatsData)
      }

      // Fetch friend statistics
      const { data: friendStatsData, error: friendStatsError } = await supabase
        .from("player_statistics")
        .select("*")
        .eq("user_id", user.id)
        .neq("player_name", user.email) // Assuming email is used as the player name for the user

      if (friendStatsError) {
        toast.error("Failed to fetch friend statistics")
      } else {
        setFriendStats(friendStatsData)
      }
    }

    fetchStats()
  }, [supabase, router])

  const StatCard = ({ title, value }: { title: string; value: number | string }) => (
    <Card className="bg-gray-800 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Account Statistics</h1>

      {userStats && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Your Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard title="Games Played" value={userStats.games_played} />
            <StatCard title="Games Won" value={userStats.games_won} />
            <StatCard
              title="Win Rate"
              value={`${((userStats.games_won / userStats.games_played) * 100).toFixed(2)}%`}
            />
            <StatCard title="Highest Checkout" value={userStats.highest_checkout} />
            <StatCard title="Average Score" value={userStats.average_score.toFixed(2)} />
          </div>
        </div>
      )}

      {friendStats.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-2">Friend Stats</h2>
          {friendStats.map((friend) => (
            <div key={friend.player_name} className="mb-4">
              <h3 className="text-lg font-medium mb-2">{friend.player_name}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <StatCard title="Games Played" value={friend.games_played} />
                <StatCard title="Games Won" value={friend.games_won} />
                <StatCard title="Win Rate" value={`${((friend.games_won / friend.games_played) * 100).toFixed(2)}%`} />
                <StatCard title="Highest Checkout" value={friend.highest_checkout} />
                <StatCard title="Average Score" value={friend.average_score.toFixed(2)} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button onClick={() => router.push("/game")} className="mt-4">
        Back to Game
      </Button>
    </div>
  )
}

