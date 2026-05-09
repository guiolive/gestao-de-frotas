import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="max-w-md mx-auto mt-12 text-center">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Página não encontrada
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          O recurso que você tentou acessar não existe ou foi removido.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Voltar pro dashboard
        </Link>
      </div>
    </div>
  );
}
