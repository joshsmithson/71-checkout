import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

type PlayerStatistics = {
  user_id: string
  player_name: string
  games_played: number
  games_won: number
  total_score: number
  highest_checkout: number
}

export async function updatePlayerStatistics(stats: PlayerStatistics) {
  const supabase = createClientComponentClient()

  const { data, error } = await supabase
    .from("player_statistics")
    .select("*")
    .eq("user_id", stats.user_id)
    .eq("player_name", stats.player_name)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching player statistics:", error)
    return
  }

  const newStats: PlayerStatistics = data
    ? {
        ...data,
        games_played: data.games_played + stats.games_played,
        games_won: data.games_won + stats.games_won,
        total_score: data.total_score + stats.total_score,
        highest_checkout: Math.max(data.highest_checkout, stats.highest_checkout),
      }
    : stats

  const { error: upsertError } = await supabase
    .from("player_statistics")
    .upsert(newStats, { onConflict: "user_id,player_name" })

  if (upsertError) {
    console.error("Error updating player statistics:", upsertError)
  }
}

