import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export const proxy = withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Routes protégées par rôle
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMINISTRATOR" && token?.role !== "SUPERVISOR") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/agent")) {
      if (token?.role !== "AGENT") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    if (path.startsWith("/agency")) {
      if (token?.role !== "AGENCY_STAFF") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Routes publiques
        const publicRoutes = ["/", "/auth/login", "/auth/register", "/trips/search"];
        if (publicRoutes.includes(path) || path.startsWith("/api/auth")) {
          return true;
        }

        // Routes protégées nécessitent une authentification
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/agent/:path*",
    "/agency/:path*",
    "/dashboard/:path*",
    "/bookings/:path*",
    "/freight/:path*",
  ],
};
