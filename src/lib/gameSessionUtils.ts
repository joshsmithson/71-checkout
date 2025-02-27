// src/lib/gameSessionUtils.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Player, GameType } from "@/types/game";

export type GameSessionTurn = {
  session_id: string;
  player_name: string;
  turn_number: number;
  throws: number[];
  score_before: number;
  score_after: number;
  is_bust: boolean;
};

export type GameSessionPlayer = {
  session_id: string;
  player_name: string;
  final_score?: number;
  position: number;
};

export type GameSession = {
  id: string;
  user_id: string;
  game_type: "301" | "501";
  status: 'in_progress' | 'completed';
  winner_name?: string;
  created_at: string;
  completed_at?: string;
  starting_score: number;
  game_session_players: GameSessionPlayer[];
  game_session_turns: GameSessionTurn[];
};

// src/lib/gameSessionUtils.ts
export async function createGameSession(
    user_id: string,
    game_type: GameType,
    players: Player[]
  ): Promise<string> {
    const supabase = createClientComponentClient();
    
    try {
      console.log("Creating game session for players:", players.map(p => p.name)); // Debug log
  
      // 1. Create game session
      const { data: sessionData, error: sessionError } = await supabase
        .from('game_sessions')
        .insert({
          user_id,
          game_type,
          status: 'in_progress',
          starting_score: game_type === "301" ? 301 : 501
        })
        .select()
        .single();
  
      if (sessionError) {
        console.error("Error creating session:", sessionError);
        throw sessionError;
      }
      if (!sessionData) {
        console.error("No session data returned");
        throw new Error('No session data returned');
      }
  
      console.log("Created session:", sessionData); // Debug log
  
      // 2. Add players to the session
      const playerInserts = players.map((player, index) => ({
        session_id: sessionData.id,
        player_name: player.name,
        position: index + 1,
        final_score: null // Add this explicitly
      }));
  
      console.log("Inserting players:", playerInserts); // Debug log
  
      const { data: playerData, error: playersError } = await supabase
        .from('game_session_players')
        .insert(playerInserts)
        .select(); // Add select to get back the inserted data
  
      if (playersError) {
        console.error("Error inserting players:", playersError);
        throw playersError;
      }
  
      console.log("Inserted players:", playerData); // Debug log
  
      return sessionData.id;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }
  
  export async function recordTurn(
    session_id: string,
    player_name: string,
    turn_number: number,
    throws: number[],
    score_before: number,
    score_after: number,
    is_bust: boolean
  ): Promise<void> {
    const supabase = createClientComponentClient();
  
    try {
      console.log("Recording turn for session:", session_id, "player:", player_name); // Debug log
  
      // First get all players in this session
      const { data: sessionPlayers, error: playerError } = await supabase
        .from('game_session_players')
        .select('*')
        .eq('session_id', session_id);
  
      if (playerError) {
        console.error("Error fetching session players:", playerError);
        throw playerError;
      }
  
      console.log("Found session players:", sessionPlayers); // Debug log
  
      const playerExists = sessionPlayers?.some(p => p.player_name === player_name);
      if (!playerExists) {
        throw new Error(`Player ${player_name} not found in game session ${session_id}`);
      }
  
      // Record the turn
      const { error } = await supabase
        .from('game_session_turns')
        .insert({
          session_id,
          player_name,
          turn_number,
          throws,
          score_before,
          score_after,
          is_bust
        });
  
      if (error) {
        console.error("Error inserting turn:", error);
        throw error;
      }
    } catch (error) {
      console.error('Error recording turn:', error);
      throw error;
    }
  }

export async function completeGameSession(
  session_id: string,
  winner_name: string,
  final_scores: Record<string, number>
): Promise<void> {
  const supabase = createClientComponentClient();

  try {
    // 1. Update game session status
    const { error: sessionError } = await supabase
      .from('game_sessions')
      .update({
        status: 'completed',
        winner_name,
        completed_at: new Date().toISOString()
      })
      .eq('id', session_id);

    if (sessionError) throw sessionError;

    // 2. Get existing player positions
    const { data: existingPlayers, error: playersError } = await supabase
      .from('game_session_players')
      .select('player_name, position')
      .eq('session_id', session_id);

    if (playersError) throw playersError;

    // Create a map of player names to their positions
    const playerPositions = Object.fromEntries(
      existingPlayers.map(player => [player.player_name, player.position])
    );

    // 3. Update final scores while preserving positions
    const updates = Object.entries(final_scores).map(([player_name, final_score]) => ({
      session_id,
      player_name,
      final_score,
      position: playerPositions[player_name] // Include the original position
    }));

    const { error: scoresError } = await supabase
      .from('game_session_players')
      .upsert(updates, {
        onConflict: 'session_id,player_name'
      });

    if (scoresError) throw scoresError;
  } catch (error) {
    console.error('Error completing game session:', error);
    throw error;
  }
}

export async function fetchDetailedGameHistory(user_id: string): Promise<GameSession[]> {
  const supabase = createClientComponentClient();

  try {
    const { data: sessions, error: sessionsError } = await supabase
      .from('game_sessions')
      .select(`
        *,
        game_session_players:game_session_players(
          player_name,
          final_score,
          position
        ),
        game_session_turns:game_session_turns(
          player_name,
          turn_number,
          throws,
          score_before,
          score_after,
          is_bust
        )
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (sessionsError) throw sessionsError;
    if (!sessions) return [];

    return sessions;
  } catch (error) {
    console.error('Error fetching game history:', error);
    throw error;
  }
}