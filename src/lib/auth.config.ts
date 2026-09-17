import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/ambientes",
  "/gravacoes",
  "/incidentes",
  "/colaboradores",
  "/relatorios",
  "/configuracoes",
];

/**
 * Configuração "edge-safe" (sem Prisma/bcrypt), usada pelo middleware, que
 * roda no Edge Runtime e não pode carregar o cliente do Prisma. A
 * configuração completa (com o provider de credenciais) vive em auth.ts e
 * roda apenas em rotas de API / server components (Node.js runtime).
 * Padrão recomendado pela documentação do Auth.js/NextAuth v5.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.organizationId = (user as any).organizationId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
