"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { toast } from "sonner"
import LeaderboardHistory from "@/components/leaderboard-history"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createOrFetchUserProfile } from "@/lib/user-profile"
import Image from "next/image"
import type { User } from "@supabase/auth-helpers-nextjs"

type Player = {
  name: string
  score: number
  throws: number[]
  statistics: {
    gamesPlayed: number
    gamesWon: number
    highestCheckout: number
    averageScorePerTurn: number
  }
}

type GameType = "301" | "501"
type ThrowType = "single" | "double" | "triple"

type UserProfile = {
  username: string
  display_name: string | null
  avatar_url: string | null
}

export default function GamePage() {
  const [players, setPlayers] = useState<Player[]>([
    {
      name: "Jared",
      score: 301,
      throws: [],
      statistics: { gamesPlayed: 0, gamesWon: 0, highestCheckout: 0, averageScorePerTurn: 0 },
    },
    {
      name: "Josh",
      score: 301,
      throws: [],
      statistics: { gamesPlayed: 0, gamesWon: 0, highestCheckout: 0, averageScorePerTurn: 0 },
    },
    {
      name: "Charlie",
      score: 301,
      throws: [],
      statistics: { gamesPlayed: 0, gamesWon: 0, highestCheckout: 0, averageScorePerTurn: 0 },
    },
  ])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [currentThrows, setCurrentThrows] = useState<number[]>([])
  const [gameType, setGameType] = useState<GameType>("301")
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [throwType, setThrowType] = useState<ThrowType>("single")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [editingPlayer, setEditingPlayer] = useState<{ index: number; name: string } | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) {
        console.error("Error checking user:", error)
        router.push("/login")
        return
      }

      try {
        const profile = await createOrFetchUserProfile(user)
        setUserProfile(profile)
        setUser(user)
      } catch (error) {
        console.error("Error handling user profile:", error)
        toast.error("Failed to load user profile")
      } finally {
        setIsLoading(false)
      }
    }
    checkUser()
  }, [supabase, router])

  const getCheckoutSuggestion = (score: number): string => {
    // ... (keep the existing getCheckoutSuggestion function)
    const checkouts: { [key: number]: string } = {
      2: "D1",
      3: "1, D1",
      4: "D2",
      5: "1, D2",
      6: "D3",
      7: "3, D2",
      8: "D4",
      9: "3, D3",
      10: "D5",
      11: "5, D3",
      12: "D6",
      13: "5, D4",
      14: "D7",
      15: "5, D5",
      16: "D8",
      17: "9, D4",
      18: "D9",
      19: "9, D5",
      20: "D10",
      21: "9, D6",
      22: "D11",
      23: "11, D6",
      24: "D12",
      25: "11, D7",
      26: "D13",
      27: "15, D6",
      28: "D14",
      29: "15, D7",
      30: "D15",
      31: "15, D8",
      32: "D16",
      33: "17, D8",
      34: "D17",
      35: "17, D9",
      36: "D18",
      37: "19, D9",
      38: "D19",
      39: "19, D10",
      40: "D20",
      41: "19, D11",
      42: "D21",
      43: "20, D11",
      44: "D22",
      45: "25, D10",
      46: "D23",
      47: "15, D16",
      48: "D24",
      49: "17, D16",
      50: "D25",
      51: "19, D16",
      52: "D26",
      53: "21, D16",
      54: "D27",
      55: "23, D16",
      56: "D28",
      57: "25, D16",
      58: "D29",
      59: "27, D16",
      60: "D30",
      61: "29, D16",
      62: "D31",
      63: "31, D16",
      64: "D32",
      65: "33, D16",
      66: "D33",
      67: "35, D16",
      68: "D34",
      69: "37, D16",
      70: "D35",
      71: "39, D16",
      72: "D36",
      73: "41, D16",
      74: "D37",
      75: "43, D16",
      76: "D38",
      77: "45, D16",
      78: "D39",
      79: "47, D16",
      80: "D40",
      81: "49, D16",
      82: "D41",
      83: "51, D16",
      84: "D42",
      85: "53, D16",
      86: "D43",
      87: "55, D16",
      88: "D44",
      89: "57, D16",
      90: "D45",
      91: "59, D16",
      92: "D46",
      93: "61, D16",
      94: "D47",
      95: "63, D16",
      96: "D48",
      97: "65, D16",
      98: "D49",
      99: "67, D16",
      100: "D50",
      101: "T20, D20",
      102: "T14, D30",
      103: "T19, D23",
      104: "T16, D28",
      105: "T20, D22",
      106: "T18, D26",
      107: "T19, D25",
      108: "T20, D24",
      109: "T19, D26",
      110: "T18, D28",
      111: "T20, D25",
      112: "T20, D26",
      113: "T19, D28",
      114: "T20, D27",
      115: "T19, D29",
      116: "T20, D28",
      117: "T19, D30",
      118: "T20, D29",
      119: "T19, D31",
      120: "T20, D30",
      121: "T20, D31",
      122: "T18, D34",
      123: "T19, D33",
      124: "T20, D32",
      125: "T15, D40",
      126: "T19, D33",
      127: "T20, D33",
      128: "T16, D40",
      129: "T19, D36",
      130: "T20, D35",
      131: "T17, D40",
      132: "T20, D36",
      133: "T19, D38",
      134: "T18, D40",
      135: "T20, D37",
      136: "T20, D38",
      137: "T19, D40",
      138: "T20, D39",
      139: "T19, D42",
      140: "T20, D40",
      141: "T20, D41",
      142: "T18, D44",
      143: "T19, D43",
      144: "T20, D42",
      145: "T15, D50",
      146: "T16, D49",
      147: "T17, D48",
      148: "T18, D47",
      149: "T19, D46",
      150: "T20, D45",
      151: "T17, B",
      152: "T20, D46",
      153: "T19, B",
      154: "T18, B",
      155: "T20, D47",
      156: "T20, D48",
      157: "T19, D50",
      158: "T20, D49",
      159: "T19, D51",
      160: "T20, D50",
      161: "T20, D51",
      164: "T16, T16, D40",
      167: "T19, T10, D20",
      170: "T18, T18, D8",
    }

    if (checkouts[score]) {
      return checkouts[score]
    }

    return "No suggestion available"
  }

  const handleThrow = (dartValue: number) => {
    if (currentThrows.length < 3) {
      const throwValue = dartValue * (throwType === "double" ? 2 : throwType === "triple" ? 3 : 1)
      const newThrows = [...currentThrows, throwValue]
      setCurrentThrows(newThrows)

      toast.success(`${throwType} ${dartValue}`, {
        position: "top-center",
      })
    }
  }

  const updatePlayerStatistics = (playerIndex: number, won: boolean, checkout: number) => {
    setPlayers((prevPlayers) => {
      const updatedPlayers = [...prevPlayers]
      const player = updatedPlayers[playerIndex]
      const stats = player.statistics

      stats.gamesPlayed++
      if (won) stats.gamesWon++
      if (checkout > stats.highestCheckout) stats.highestCheckout = checkout

      const totalScore = player.throws.reduce((sum, score) => sum + score, 0)
      const turns = Math.ceil(player.throws.length / 3)
      stats.averageScorePerTurn = totalScore / turns

      return updatedPlayers
    })
  }

  const confirmThrows = async () => {
    if (!user) return
    const newPlayers = [...players]
    const currentPlayer = newPlayers[currentPlayerIndex]
    const throwSum = currentThrows.reduce((a, b) => a + b, 0)
    const newScore = currentPlayer.score - throwSum

    const isCheckout = newScore === 0 && throwType === "double"

    if (newScore < 0 || newScore === 1 || (newScore === 0 && !isCheckout)) {
      toast.error("Bust!")
      setCurrentThrows([])
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length)
      return
    }

    currentPlayer.score = newScore
    currentPlayer.throws = [...currentPlayer.throws, ...currentThrows]

    if (isCheckout) {
      // Game won
      setPlayers(newPlayers)
      updatePlayerStatistics(currentPlayerIndex, true, throwSum)
      try {
        console.log("About to save game history for winner:", currentPlayer.name)
        await saveGameHistory(currentPlayer.name)
        toast.success(`🎯 ${currentPlayer.name} wins!`, {
          duration: 5000,
          position: "top-center",
        })
      } catch (error) {
        console.error("Error saving game history:", error)
        toast.error(`Failed to save game history: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
      resetGame()
    } else {
      // Continue game
      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length)
      setPlayers(newPlayers)
      toast.info(`${players[(currentPlayerIndex + 1) % players.length].name}'s turn`)
    }

    setCurrentThrows([])
    setRefreshTrigger((prev) => prev + 1)
  }

  const cancelThrows = () => {
    setCurrentThrows([])
  }

  const resetGame = () => {
    if (!user) return
    const initialScore = gameType === "301" ? 301 : 501
    setPlayers(players.map((player) => ({ ...player, score: initialScore, throws: [] })))
    setCurrentPlayerIndex(0)
    setCurrentThrows([])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const addPlayer = () => {
    if (!user) return
    if (newPlayerName.trim() !== "") {
      setPlayers([
        ...players,
        {
          name: newPlayerName,
          score: gameType === "301" ? 301 : 501,
          throws: [],
          statistics: { gamesPlayed: 0, gamesWon: 0, highestCheckout: 0, averageScorePerTurn: 0 },
        },
      ])
      setNewPlayerName("")
      setIsAddingPlayer(false)
    }
  }

  const saveGameHistory = async (winner: string) => {
    if (!user || !userProfile) {
      console.error("No user or user profile found when trying to save game history")
      return
    }
    const gameData = {
      user_id: user.id,
      game_type: gameType,
      players: players.map((p) => p.name),
      winner: winner,
    }
    console.log("Saving game history:", gameData)
    const { data, error } = await supabase.from("game_history").insert(gameData).select()
    if (error) {
      console.error("Supabase error when saving game history:", error)
      throw error
    }
    if (!data || data.length === 0) {
      console.error("No data returned after inserting game history")
      throw new Error("Failed to save game history")
    }
    console.log("Game history saved:", data)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleRenamePlayer = (index: number) => {
    setEditingPlayer({ index, name: players[index].name })
  }

  const savePlayerName = () => {
    if (editingPlayer) {
      setPlayers(
        players.map((player, index) =>
          index === editingPlayer.index ? { ...player, name: editingPlayer.name } : player,
        ),
      )
      setEditingPlayer(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to play.</div>
  }

  const currentPlayer = players[currentPlayerIndex]
  const remainingScore = currentPlayer.score - currentThrows.reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Card className="w-full max-w-md bg-gray-800 text-white shadow-xl">
        <CardHeader className="border-b border-gray-700">
          <CardTitle className="text-2xl font-bold text-center">{gameType} Dart Game</CardTitle>
          <div className="text-center text-sm text-gray-400">
            Logged in as: {userProfile ? userProfile.display_name || userProfile.username : user?.email}
          </div>
          {userProfile?.avatar_url && (
            <Image
              src={userProfile.avatar_url || "/placeholder.svg"}
              alt="User Avatar"
              width={40}
              height={40}
              className="rounded-full mx-auto mt-2"
            />
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between items-center gap-4">
            <Select
              value={gameType}
              onValueChange={(value: GameType) => {
                setGameType(value)
                resetGame()
              }}
            >
              <SelectTrigger className="w-[100px] bg-gray-700">
                <SelectValue placeholder="Game Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301</SelectItem>
                <SelectItem value="501">501</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setIsAddingPlayer(true)} variant="outline" className="bg-gray-700 text-sm">
              Add Player
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {players.map((player, index) => (
              <Card key={index} className={`p-2 ${index === currentPlayerIndex ? "bg-blue-600" : "bg-gray-700"}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm">{player.name}</h3>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRenamePlayer(index)}>
                    ✏️
                  </Button>
                </div>
                <p className="text-xl">{player.score}</p>
                <p className="text-xs">Avg: {player.statistics.averageScorePerTurn.toFixed(1)}</p>
              </Card>
            ))}
          </div>

          {/* Player Rename Dialog */}
          <Dialog open={editingPlayer !== null} onOpenChange={() => setEditingPlayer(null)}>
            <DialogContent className="bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Rename Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Player Name</Label>
                  <Input
                    value={editingPlayer?.name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingPlayer((prev) => (prev ? { ...prev, name: e.target.value } : null))
                    }
                    className="bg-gray-700"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditingPlayer(null)}>
                    Cancel
                  </Button>
                  <Button onClick={savePlayerName}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isAddingPlayer && (
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="New player name"
                value={newPlayerName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPlayerName(e.target.value)}
                className="flex-grow bg-gray-700"
              />
              <Button onClick={addPlayer} className="bg-green-600">
                Add
              </Button>
              <Button onClick={() => setIsAddingPlayer(false)} variant="outline" className="bg-gray-700">
                Cancel
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <motion.h3
              key={currentPlayerIndex}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-lg font-bold"
            >
              {currentPlayer.name}&apos;s Turn
            </motion.h3>

            <div className="flex justify-between mb-2">
              {(["single", "double", "triple"] as ThrowType[]).map((type) => (
                <Button
                  key={type}
                  onClick={() => setThrowType(type)}
                  variant={throwType === type ? "default" : "outline"}
                  className={`flex-1 ${throwType === type ? "bg-blue-600" : "bg-gray-700"}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-1">
              {[...Array(20)].map((_, i) => (
                <Button
                  key={i}
                  onClick={() => handleThrow(i + 1)}
                  disabled={currentThrows.length >= 3}
                  className="bg-gray-700 p-2 text-sm hover:bg-gray-600 disabled:opacity-50"
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                onClick={() => handleThrow(25)}
                disabled={currentThrows.length >= 3}
                className="bg-gray-700 p-2 text-sm hover:bg-gray-600 disabled:opacity-50"
              >
                Bull
              </Button>
            </div>

            <Button
              onClick={() => handleThrow(0)}
              disabled={currentThrows.length >= 3}
              className="w-full bg-gray-700 mt-2 hover:bg-gray-600 disabled:opacity-50"
            >
              Miss
            </Button>

            <div className="flex justify-between items-center mt-4">
              <div>
                <p className="text-sm">Current: {currentThrows.join(", ")}</p>
                <p className="text-lg font-bold">Remaining: {remainingScore}</p>
                <p className="text-sm">Checkout: {getCheckoutSuggestion(remainingScore)}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={confirmThrows}
                  disabled={currentThrows.length !== 3}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Confirm
                </Button>
                <Button onClick={cancelThrows} variant="outline" className="bg-red-600 hover:bg-red-700">
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4 border-t border-gray-700">
            <Button onClick={resetGame} variant="outline" className="flex-1 bg-gray-700 hover:bg-gray-600">
              Reset Game
            </Button>
            <Button onClick={handleLogout} variant="destructive" className="flex-1">
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
      <LeaderboardHistory className="mt-4 w-full max-w-md" refreshTrigger={refreshTrigger} />
    </div>
  )
}

