const statusColors: Record<string, string> = {
  disponivel: "bg-green-100 text-green-800",
  em_uso: "bg-blue-100 text-blue-800",
  manutencao: "bg-yellow-100 text-yellow-800",
  inativo: "bg-red-100 text-red-800",
  ativo: "bg-green-100 text-green-800",
  suspenso: "bg-orange-100 text-orange-800",
  agendada: "bg-blue-100 text-blue-800",
  em_andamento: "bg-yellow-100 text-yellow-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-800",
  aguardando: "bg-yellow-100 text-yellow-800",
  preventiva: "bg-blue-100 text-blue-800",
  corretiva: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  disponivel: "Disponivel",
  em_uso: "Em Uso",
  manutencao: "Em Manutencao",
  inativo: "Inativo",
  ativo: "Ativo",
  suspenso: "Suspenso",
  agendada: "Agendada",
  em_andamento: "Em Andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  cancelado: "Cancelado",
  aguardando: "Aguardando",
  preventiva: "Preventiva",
  corretiva: "Corretiva",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusLabels[status] || status}
    </span>
  );
}
