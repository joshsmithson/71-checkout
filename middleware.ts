import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Allow auth callback to proceed without a session
    if (req.nextUrl.pathname.startsWith('/auth/callback')) {
      return res
    }

    // Redirect to login if no session and not already on login page
    if (!session && req.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    return res
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}