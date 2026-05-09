/**
 * Skeleton mostrado durante navegação entre rotas do dashboard.
 * Sem ele, o Next renderiza nada até o server component resolver,
 * deixando a UI parecendo travada.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded" />
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <div className="h-4 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-1/2 bg-slate-200 rounded" />
        <div className="h-4 w-5/6 bg-slate-200 rounded" />
      </div>
      <div className="bg-white rounded-lg shadow p-6 space-y-3">
        <div className="h-4 w-2/3 bg-slate-200 rounded" />
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
