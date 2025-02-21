import type { User as SupabaseUser } from "@supabase/auth-helpers-nextjs"

export type User = SupabaseUser & {
  // Add any additional properties your user object might have
}

