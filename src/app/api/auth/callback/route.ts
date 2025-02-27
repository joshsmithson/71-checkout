import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  console.log('Callback URL:', requestUrl.toString())

  const code = requestUrl.searchParams.get("code")
  console.log('Received code:', code)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin
  console.log('Base URL:', baseUrl)

  try {
    if (!code) {
      console.error('No code provided')
      return NextResponse.redirect(`${baseUrl}/login?error=no_code`)
    }

    console.log('Exchanging code for session...')
    // Create the Supabase client with awaited cookies
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${baseUrl}/login?error=session_error`)
    }

    if (!data.session) {
      console.error('No session created')
      return NextResponse.redirect(`${baseUrl}/login?error=no_session`)
    }

    console.log('Authentication successful, redirecting to game page')
    return NextResponse.redirect(`${baseUrl}/game`)
  } catch (e) {
    console.error('Callback error:', e)
    return NextResponse.redirect(`${baseUrl}/login?error=callback_error`)
  }
}