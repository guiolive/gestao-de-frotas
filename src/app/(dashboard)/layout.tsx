import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar, { type SidebarUser } from "@/components/Sidebar";
import { verificarToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

// Lê o usuário no servidor pra montar a sidebar com dados corretos no
// primeiro render — antes ela buscava via fetch /api/auth/me em useEffect,
// causando flash de "menus sumindo" durante a navegação.
//
// Também age como segunda barreira de auth: middleware valida o JWT, mas
// não checa se o usuário ainda existe ou está ativo no DB. Aqui re-checamos
// a cada navegação — usuário desativado é deslogado mesmo com token válido.
async function lerUsuarioParaSidebar(): Promise<SidebarUser | null> {
  const token = cookies().get("token")?.value;
  if (!token) return null;
  const payload = await verificarToken(token);
  if (!payload) return null;

  const usuario = await prisma.usuario.findUnique({
    where: { id: payload.id },
    select: { nome: true, tipo: true, setor: true, ativo: true },
  });
  if (!usuario || !usuario.ativo) return null;

  return {
    nome: usuario.nome,
    tipo: usuario.tipo,
    setor: usuario.setor ?? "AMBOS",
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await lerUsuarioParaSidebar();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full flex">
      <Sidebar user={user} />
      {/* `max-w-screen-2xl` (1536px) + `mx-auto` evita que o conteúdo
          se esparrame em monitores grandes (4K/ultrawide). O calendário
          do agendamento precisa de ~1280px e cabe folgado. */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
