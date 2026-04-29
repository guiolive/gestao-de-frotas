import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex">
      <Sidebar />
      {/* `max-w-screen-2xl` (1536px) + `mx-auto` evita que o conteúdo
          se esparrame em monitores grandes (4K/ultrawide). O calendário
          do agendamento precisa de ~1280px e cabe folgado. */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
