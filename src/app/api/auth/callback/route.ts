import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const error_description = requestUrl.searchParams.get("error_description")

    if (error) {
      console.error('Auth error:', error, error_description)
      return NextResponse.redirect(new URL(`/login?error=${error}`, request.url))
    }

    if (!code) {
      console.error('No code provided')
      return NextResponse.redirect(new URL('/login?error=no_code', request.url))
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(new URL(`/login?error=session_error`, request.url))
    }

    if (!data.session) {
      console.error('No session created')
      return NextResponse.redirect(new URL('/login?error=no_session', request.url))
    }

    return NextResponse.redirect(new URL("/game", request.url))
  } catch (e) {
    console.error('Callback error:', e)
    return NextResponse.redirect(new URL('/login?error=callback_error', request.url))
  }
}