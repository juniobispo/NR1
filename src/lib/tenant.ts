import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Recupera a sessão atual e garante que existe uma organização associada.
 * Lança um `Response` (401/403) que deve ser capturado por `apiHandler`
 * (ou por um try/catch equivalente) e devolvido diretamente ao cliente.
 * Todas as queries subsequentes na rota devem filtrar por `organizationId`
 * para garantir o isolamento multi-tenant.
 */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const organizationId = (session.user as any).organizationId as string | undefined;
  if (!organizationId) {
    throw NextResponse.json({ error: "Usuário sem organização vinculada." }, { status: 403 });
  }
  return {
    session,
    userId: (session.user as any).id as string,
    organizationId,
    role: (session.user as any).role as string,
  };
}

export function requireRole(role: string, allowed: string[]) {
  if (!allowed.includes(role)) {
    throw NextResponse.json({ error: "Permissão insuficiente para esta ação." }, { status: 403 });
  }
}

type RouteContext = { params: Promise<Record<string, string>> } | undefined;

/**
 * Envolve um handler de rota para capturar `Response`s lançados por
 * `requireSession`/`requireRole` e devolvê-los como a resposta HTTP,
 * além de padronizar erros inesperados como 500.
 */
export function apiHandler(fn: (req: NextRequest, ctx: RouteContext) => Promise<Response>) {
  return async (req: NextRequest, ctx?: RouteContext) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof Response) return err;
      console.error(err);
      return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
    }
  };
}
