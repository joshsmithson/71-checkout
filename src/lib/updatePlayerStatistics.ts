import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type PlayerStatistics = {
  user_id: string
  player_name: string
  games_played: number
  games_won: number
  total_score: number
  highest_checkout: number
  average_score: number
}

export async function updatePlayerStatistics(stats: PlayerStatistics) {
  const supabase = createClientComponentClient()

  try {
    // First, try to fetch existing statistics without using .single()
    const { data: existingData, error: fetchError } = await supabase
      .from("player_statistics")
      .select("*")
      .eq("user_id", stats.user_id)
      .eq("player_name", stats.player_name)

    if (fetchError) {
      console.error("Error fetching player statistics:", fetchError)
      return
    }

    // Get the existing stats if they exist, otherwise use empty stats
    const currentStats = existingData?.[0]

    let newStats: PlayerStatistics
    if (currentStats) {
      // Update existing statistics
      const totalGames = currentStats.games_played + stats.games_played
      const totalScore = currentStats.total_score + stats.total_score
      
      newStats = {
        ...currentStats,
        games_played: totalGames,
        games_won: currentStats.games_won + stats.games_won,
        total_score: totalScore,
        highest_checkout: Math.max(currentStats.highest_checkout, stats.highest_checkout),
        average_score: totalScore / totalGames
      }
    } else {
      // Create new statistics
      newStats = {
        ...stats,
        average_score: stats.total_score / stats.games_played
      }
    }

    // Upsert the statistics
    const { error: upsertError } = await supabase
      .from("player_statistics")
      .upsert(newStats, {
        onConflict: "user_id,player_name"
      })

    if (upsertError) {
      throw upsertError
    }

    return newStats
  } catch (error) {
    console.error("Error updating player statistics:", error)
    throw error
  }
}