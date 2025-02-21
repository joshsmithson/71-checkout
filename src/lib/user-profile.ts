import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { User } from "@supabase/auth-helpers-nextjs"

export async function createOrFetchUserProfile(user: User) {
  const supabase = createClientComponentClient()

  // Try to fetch the existing profile
  let { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code === 'PGRST116') {
    // Profile doesn't exist, so let's create it
    const newProfile = {
      id: user.id,
      username: user.email?.split('@')[0] || `user_${Math.random().toString(36).substr(2, 9)}`,
      display_name: user.user_metadata.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata.avatar_url,
    }

    const { data, error: insertError } = await supabase
      .from('users')
      .insert(newProfile)
      .select()
      .single()

    if (insertError) {
      console.error("Error creating user profile:", insertError)
      throw insertError
    }

    profile = data
  } else if (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }

  return profile
}
