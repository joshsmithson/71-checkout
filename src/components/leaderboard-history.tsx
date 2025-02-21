"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import type { DateRange } from "react-day-picker"

type GameHistory = {
  id: number
  created_at: string
  user_id: string
  game_type: string
  players: string[]
  winner: string
  username: string
}

type LeaderboardEntry = {
  player: string
  wins: number
}

interface LeaderboardHistoryProps {
  className?: string
  refreshTrigger?: number
}

export default function LeaderboardHistory({ className = "", refreshTrigger = 0 }: LeaderboardHistoryProps) {
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("leaderboard")
  const supabase = createClientComponentClient()
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [searchUsername, setSearchUsername] = useState<string>("")
  const [currentUsername, setCurrentUsername] = useState<string>("")

  const fetchGameHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("game_history").select(`
          *,
          users:user_id (username)
        `)

      if (currentUsername) {
        query = query.ilike("users.username", `%${currentUsername}%`)
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("No user found")
        query = query.eq("user_id", user.id)
      }

      // Add date range filters if set
      if (dateRange?.from) {
        query = query.gte("created_at", dateRange.from.toISOString())
      }
      if (dateRange?.to) {
        query = query.lte("created_at", dateRange.to.toISOString())
      }

      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) throw error
      if (!data) throw new Error("No data returned from Supabase")

      const formattedData = data.map((game) => ({
        ...game,
        username: game.users?.username || "Unknown",
      }))

      console.log("Fetched game history:", formattedData)
      setGameHistory(formattedData)
      calculateLeaderboard(formattedData)
    } catch (error) {
      console.error("Error in fetchGameHistory:", error)
      toast.error(`Failed to load game history: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, dateRange, currentUsername])

  useEffect(() => {
    console.log("LeaderboardHistory component mounted or dependencies changed")
    fetchGameHistory()
  }, [fetchGameHistory, refreshTrigger])

  const calculateLeaderboard = (history: GameHistory[]) => {
    console.log("Calculating leaderboard with history:", history)
    const winCounts: { [key: string]: number } = {}
    history.forEach((game) => {
      if (game.winner) {
        winCounts[game.winner] = (winCounts[game.winner] || 0) + 1
      }
    })
    const leaderboardData = Object.entries(winCounts)
      .map(([player, wins]) => ({ player, wins }))
      .sort((a, b) => b.wins - a.wins)
    console.log("Calculated leaderboard:", leaderboardData)
    setLeaderboard(leaderboardData)
  }

  const handleSearch = () => {
    setCurrentUsername(searchUsername)
    fetchGameHistory()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <Card className={`bg-gray-800 text-white shadow-xl ${className}`}>
      <CardHeader className="border-b border-gray-700">
        <CardTitle className="text-xl font-bold text-center">Leaderboard & History</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="mb-4 space-y-2">
          <Input
            type="text"
            placeholder="Search by username"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="bg-gray-700"
          />
          <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
            Search
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal bg-gray-700">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  "Pick a date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from ?? new Date()}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="leaderboard" className="data-[state=active]:bg-blue-600">
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
              Game History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="leaderboard">
            <AnimatePresence mode="wait">
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
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
              </motion.div>
            </AnimatePresence>
          </TabsContent>
          <TabsContent value="history">
            <AnimatePresence mode="wait">
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-2"
              >
                {gameHistory.map((game) => (
                  <Card key={game.id} className="bg-gray-700">
                    <CardContent className="p-3">
                      <p className="text-sm text-gray-300">{new Date(game.created_at).toLocaleDateString()}</p>
                      <p className="font-medium">
                        {game.game_type} - Winner: {game.winner}
                      </p>
                      <p className="text-sm text-gray-300">Players: {game.players.join(", ")}</p>
                      <p className="text-sm text-gray-300">Username: {game.username}</p>
                    </CardContent>
                  </Card>
                ))}
                {gameHistory.length === 0 && <p className="text-center text-gray-400">No game history available</p>}
              </motion.div>
            </AnimatePresence>
          </TabsContent>
        </Tabs>
        <Button onClick={fetchGameHistory} className="mt-4 w-full bg-gray-700 hover:bg-gray-600">
          Refresh Data
        </Button>
      </CardContent>
    </Card>
  )
}

