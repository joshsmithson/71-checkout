"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import LeaderboardHistory from "@/components/leaderboard-history"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

type LeaderboardEntry = {
  player: string
  wins: number
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("game_history").select("winner")

      if (error) throw error

      const winCounts: { [key: string]: number } = {}
      data.forEach((game) => {
        if (game.winner) {
          winCounts[game.winner] = (winCounts[game.winner] || 0) + 1
        }
      })

      const leaderboardData = Object.entries(winCounts)
        .map(([player, wins]) => ({ player, wins }))
        .sort((a, b) => b.wins - a.wins)

      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
      toast.error("Failed to load leaderboard")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="bg-gray-800 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-700">
            <CardTitle className="text-xl font-bold">Leaderboard</CardTitle>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-gray-800 text-white border-gray-700">
                <SheetHeader>
                  <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-4">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/game")}>
                    Back to Game
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-red-400" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-white">Player</TableHead>
                    <TableHead className="text-white">Wins</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.map((entry) => (
                    <TableRow key={entry.player} className="border-gray-700">
                      <TableCell className="font-medium text-white">{entry.player}</TableCell>
                      <TableCell className="text-white">{entry.wins}</TableCell>
                    </TableRow>
                  ))}
                  {leaderboard.length === 0 && ( 
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-gray-400">
                        No games played yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <LeaderboardHistory />
      </div>
    </div>
  )
}

