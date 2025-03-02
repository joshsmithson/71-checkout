"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { User } from "@supabase/auth-helpers-nextjs"
import { updatePlayerStatistics } from "@/lib/updatePlayerStatistics"
import { createGameSession, recordTurn, completeGameSession } from '@/lib/gameSessionUtils';
import { getCheckoutSuggestions } from "@/lib/checkoutUtils";
import { GameType, Player, createInitialPlayer } from "@/types/game";

const initialPlayer = createInitialPlayer();

export default function GamePage() {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [gameType, setGameType] = useState<GameType>("301")
  const [players, setPlayers] = useState<Player[]>([initialPlayer])
  const [user, setUser] = useState<User | null>(null)
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [isAddingPlayer, setIsAddingPlayer] = useState(false)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<{ index: number; name: string } | null>(null)
  const [throwValues, setThrowValues] = useState<number[]>([])
  const [multiplier, setMultiplier] = useState(1)
  const [isBust, setIsBust] = useState(false)
  const [checkoutSuggestions, setCheckoutSuggestions] = useState<string[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        setUser(session.user)
      } else {
        router.push("/login")
      }
    }

    getSession()
  }, [supabase, router])

  const startNewGame = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const newSessionId = await createGameSession(user.id, gameType, players);
      setSessionId(newSessionId);
    } catch (error) {
      console.error("Error starting new game:", error);
      toast.error("Failed to start new game");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
  
      if (session) {
        setUser(session.user)
      } else {
        router.push("/login")
      }
    }
  
    getSession()
  }, [supabase, router])

  const handleStartGame = async () => {
    if (!user || players.length === 0) return;
    
    try {
      setIsLoading(true);
      const newSessionId = await createGameSession(user.id, gameType, players);
      setSessionId(newSessionId);
      setIsGameStarted(true);
      toast.success("Game started!");
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error("Failed to start game");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentPlayer = players[currentPlayerIndex]
    const remainingScore = currentPlayer.score - throwValues.reduce((sum, value) => sum + value, 0)
    const suggestions = getCheckoutSuggestions(remainingScore)
    setCheckoutSuggestions(suggestions)
  }, [players, currentPlayerIndex, throwValues])

  const handleGameTypeChange = async (value: GameType) => {
    setGameType(value);
    if (user) {
      try {
        setIsLoading(true);
        const resetPlayers = players.map(player => ({
          ...player,
          score: value === "301" ? 301 : 501,
          throws: []
        }));
        setPlayers(resetPlayers);
        
        const newSessionId = await createGameSession(user.id, value, resetPlayers);
        setSessionId(newSessionId);
        
        setCurrentPlayerIndex(0);
        setThrowValues([]);
        setIsBust(false);
        setMultiplier(1);
      } catch (error) {
        console.error("Error changing game type:", error);
        toast.error("Failed to start new game");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const addPlayer = () => {
    if (newPlayerName.trim() !== "") {
      if (players.length < 8) {
        const newPlayer: Player = {
          name: newPlayerName,
          score: gameType === "301" ? 301 : 501,
          throws: [],
          statistics: {
            player_name: newPlayerName,
            games_played: 0,
            games_won: 0,
            total_score: 0,
            highest_checkout: 0,
            average_score: 0
          }
        }
        setPlayers([...players, newPlayer])
        setNewPlayerName("")
        setIsAddingPlayer(false)
      } else {
        toast.error("Maximum 8 players allowed")
      }
    } else {
      toast.error("Player name cannot be blank")
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      const newPlayers = players.filter((_, i) => i !== index)
      setPlayers(newPlayers)
      if (currentPlayerIndex >= newPlayers.length) {
        setCurrentPlayerIndex(0)
      }
    } else {
      toast.error("At least one player is required")
    }
  }

  const handleRenamePlayer = (index: number) => {
    setEditingPlayer({ index, name: players[index].name })
  }

  const savePlayerName = () => {
    if (editingPlayer && editingPlayer.name.trim() !== "") {
      setPlayers(
        players.map((player, index) =>
          index === editingPlayer.index ? { ...player, name: editingPlayer.name } : player,
        ),
      )
      setEditingPlayer(null)
    } else {
      toast.error("Player name cannot be blank")
    }
  }

  const handleThrowInput = (value: number) => {
    if (throwValues.length < 3) {
      const score = value * multiplier
      setThrowValues([...throwValues, score])
    }
  }

  const updateGameStatistics = async (winnerIndex: number) => {
    if (!user) {
      console.error("No user logged in")
      return
    }
  
    const startingScore = gameType === "301" ? 301 : 501
  
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      const totalScore = startingScore - player.score
      const highestCheckout = i === winnerIndex ? player.throws[player.throws.length - 1] : 0
  
      const turnsThisGame = player.throws.length
      const averageThisGame = turnsThisGame > 0 ? totalScore / turnsThisGame : 0
  
      await updatePlayerStatistics({
        user_id: user.id,
        player_name: player.name,
        games_played: 1,
        games_won: i === winnerIndex ? 1 : 0,
        total_score: totalScore,
        highest_checkout: highestCheckout,
        average_score: averageThisGame
      })
    }
  }

  const submitThrow = async () => {
    if (!sessionId || !isGameStarted || throwValues.length !== 3) {
      toast.error("Please start the game and enter all 3 throws before submitting");
      return;
    }

    try {
      setIsLoading(true);
      const throwTotal = throwValues.reduce((sum, value) => sum + value, 0);
      const currentPlayer = players[currentPlayerIndex];
      const newScore = currentPlayer.score - throwTotal;
      const isBustThrow = newScore < 0 || newScore === 1;

      await recordTurn(
        sessionId,
        currentPlayer.name,
        currentPlayer.throws.length + 1,
        throwValues,
        currentPlayer.score,
        isBustThrow ? currentPlayer.score : newScore,
        isBustThrow
      );

      if (isBustThrow) {
        toast.error("Bust!");
        setIsBust(true);
        setThrowValues([]);
        return;
      }

      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex] = {
        ...currentPlayer,
        score: newScore,
        throws: [...currentPlayer.throws, throwTotal],
      };

      setPlayers(updatedPlayers);
      setThrowValues([]);
      setIsBust(false);
      setMultiplier(1);

      if (newScore === 0) {
        const finalScores = Object.fromEntries(
          players.map(p => [p.name, p.score])
        );
        
        await completeGameSession(sessionId, currentPlayer.name, finalScores);
        await updateGameStatistics(currentPlayerIndex);
        
        toast.success(`${currentPlayer.name} wins!`);
        resetGame();
        return;
      }

      setCurrentPlayerIndex((currentPlayerIndex + 1) % players.length);
    } catch (error) {
      console.error("Error recording turn:", error);
      toast.error("Failed to record turn");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelThrow = () => {
    setThrowValues([])
    setMultiplier(1)
    setIsBust(false)
  }

  const resetGame = async () => {
    if (!user) return;
  
    try {
      setIsLoading(true);
      setIsGameStarted(false); // Reset game started state
      const resetScore = gameType === "301" ? 301 : 501;
      const resetPlayers = players.map(player => ({ 
        ...player, 
        score: resetScore, 
        throws: [] 
      }));
      
      setPlayers(resetPlayers);
      setCurrentPlayerIndex(0);
      setThrowValues([]);
      setIsBust(false);
      setMultiplier(1);
      setSessionId(null); // Reset session ID
    } catch (error) {
      console.error("Error resetting game:", error);
      toast.error("Failed to reset game");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <Card className="w-full max-w-md bg-gray-800 text-white shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">{gameType} Dart Game</CardTitle>
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
                <SheetDescription className="text-gray-400">
                  Access additional game options and account settings.
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-4">
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/profile")}>
                  Profile
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/account")}>
                  Account
                </Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/leaderboard")}>
                  Leaderboard
                </Button>
                <Button variant="ghost" className="w-full justify-start text-red-400" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="flex justify-between items-center gap-4">
            <Select
              value={gameType}
              onValueChange={handleGameTypeChange}
              disabled={isLoading || isGameStarted}
            >
              <SelectTrigger className="w-[100px] bg-gray-700">
                <SelectValue placeholder="Game Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="301">301</SelectItem>
                <SelectItem value="501">501</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => setIsAddingPlayer(true)} 
              variant="outline" 
              className="bg-gray-700 text-sm"
              disabled={isLoading || isGameStarted}
            >
              Add Player
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {players.map((player, index) => (
              <Card key={index} className={`p-2 ${index === currentPlayerIndex && isGameStarted ? "bg-blue-600" : "bg-gray-700"}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm">{player.name}</h3>
                  {!isGameStarted && (
                    <div className="flex">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleRenamePlayer(index)}>
                        ✏️
                      </Button>
                      {players.length > 1 && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removePlayer(index)}>
                          ❌
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xl">{player.score}</p>
              </Card>
            ))}
          </div>

          {!isGameStarted && players.length > 0 && (
            <Button
              onClick={handleStartGame}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start Game"}
            </Button>
          )}

          <Dialog open={isAddingPlayer} onOpenChange={setIsAddingPlayer}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Add New Player</DialogTitle>
                <DialogDescription>Enter the name of the new player to add them to the game.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="col-span-3 bg-gray-700"
                  />
                </div>
              </div>
              <Button onClick={addPlayer} className="bg-blue-500 hover:bg-blue-400">
                Add Player
              </Button>
            </DialogContent>
          </Dialog>

          <Dialog open={editingPlayer !== null} onOpenChange={() => setEditingPlayer(null)}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 text-white">
              <DialogHeader>
                <DialogTitle>Rename Player</DialogTitle>
                <DialogDescription>Enter a new name for the player.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    New Name
                  </Label>
                  <Input
                    id="name"
                    value={editingPlayer?.name || ""}
                    onChange={(e) => setEditingPlayer((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                    className="col-span-3 bg-gray-700"
                  />
                </div>
              </div>
              <Button onClick={savePlayerName} className="bg-blue-500 hover:bg-blue-400">
                Save Name
              </Button>
            </DialogContent>
          </Dialog>

          {isGameStarted ? (
            <div className="space-y-2">
              <h3 className="text-lg font-bold">Current Player: {players[currentPlayerIndex]?.name}</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => setMultiplier(1)}
                  className={`bg-gray-700 text-white font-semibold ${multiplier === 1 ? "ring-2 ring-blue-500" : ""}`}
                >
                  Single
                </Button>
                <Button
                  onClick={() => setMultiplier(2)}
                  className={`bg-gray-700 text-white font-semibold ${multiplier === 2 ? "ring-2 ring-blue-500" : ""}`}
                >
                  Double
                </Button>
                <Button
                  onClick={() => setMultiplier(3)}
                  className={`bg-gray-700 text-white font-semibold ${multiplier === 3 ? "ring-2 ring-blue-500" : ""}`}
                >
                  Triple
                </Button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((number) => (
                  <Button key={number} onClick={() => handleThrowInput(number)} className="bg-gray-700">
                    {number}
                  </Button>
                ))}
                <Button onClick={() => handleThrowInput(25)} className="bg-gray-700">
                  25
                </Button>
                <Button onClick={() => handleThrowInput(multiplier === 2 ? 50 : 25)} className="bg-gray-700">
                  Bull
                </Button>
              </div>
              <Button onClick={() => handleThrowInput(0)} className="bg-gray-700 w-full">
                Miss
              </Button>
              <div className={`flex items-center justify-between bg-gray-700 p-3 rounded-md ${isBust ? "border-2 border-red-500" : ""}`}>
  <span className="font-semibold">Remaining:</span>
  <span className={`text-xl font-bold ${isBust ? "text-red-500" : ""}`}>
    {players[currentPlayerIndex].score - throwValues.reduce((sum, value) => sum + value, 0)}
  </span>
</div>

              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Current throws"
                  value={throwValues.join(", ")}
                  readOnly
                  className="bg-gray-700 flex-grow"
                />
                <Button 
                  onClick={submitThrow} 
                  className="bg-green-500 hover:bg-green-400"
                  disabled={isLoading || throwValues.length !== 3}
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </Button>
                <Button 
                  onClick={cancelThrow} 
                  className="bg-red-500 hover:bg-red-400"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Checkout Suggestions:</h4>
                {checkoutSuggestions.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {checkoutSuggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No checkout suggestions available.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4">
              Add players and click Start Game to begin
            </div>
          )}

          <Button 
            onClick={resetGame} 
            variant="outline" 
            className="w-full bg-gray-700 hover:bg-gray-600"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : isGameStarted ? "Reset Game" : "Clear Players"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

