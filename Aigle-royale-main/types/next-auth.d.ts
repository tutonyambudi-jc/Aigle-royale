import type { UserRole } from "@/lib/auth"
import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
    }
  }

  interface User {
    role: UserRole
    id: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole
    id: string
  }
}
