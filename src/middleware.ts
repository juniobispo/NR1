import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/ambientes/:path*",
    "/gravacoes/:path*",
    "/incidentes/:path*",
    "/colaboradores/:path*",
    "/relatorios/:path*",
    "/configuracoes/:path*",
  ],
};
