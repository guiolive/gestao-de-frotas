/**
 * Placeholder do bloco "Padrões de uso". A intenção é que, conforme o
 * histórico de viagens cresça, este card mostre insights agregados:
 *  - unidades demandantes mais frequentes,
 *  - destinos recorrentes,
 *  - semanas/meses de pico,
 *  - ex.: "IESA costuma pedir veículo nesta semana do ano".
 *
 * Hoje a base tem só ~3 meses e os padrões não seriam confiáveis. Esta
 * estrutura está pronta para receber a lógica de agregação depois sem
 * mexer no layout do painel.
 */
import { BarChart3 } from "lucide-react";

export default function PadroesPainel() {
  return (
    <div className="bg-white rounded-lg shadow mb-6 border border-dashed border-gray-200">
      <div className="px-6 py-5 flex items-start gap-4">
        <div className="bg-gray-100 rounded-lg p-3 flex-shrink-0">
          <BarChart3 className="w-6 h-6 text-gray-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-700 mb-1">
            Padrões de uso
            <span className="ml-2 text-xs font-normal text-gray-400">
              em breve
            </span>
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            À medida que o histórico de viagens cresce, padrões de uso vão
            aparecer aqui: unidades que mais demandam, destinos recorrentes
            e semanas de pico. Por enquanto a base ainda é curta — quando
            tiver volume, este espaço passa a sugerir, por exemplo,
            &ldquo;IESA costuma pedir veículo nesta semana do ano&rdquo;.
          </p>
        </div>
      </div>
    </div>
  );
}
