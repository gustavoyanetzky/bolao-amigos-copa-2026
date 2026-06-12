// CardPremiacao — card de premiacao 1o/2o/3o com medalhas ouro/prata/bronze.
// Mostra os percentuais (60/30/10) e, opcionalmente, os valores em R$.
// Apresentacional puro. Conforme mockup 01.

import Icon from "./Icon";

interface CardPremiacaoProps {
  /** Percentual do 1o lugar (ex: 60). */
  pct1: number;
  /** Percentual do 2o lugar (ex: 30). */
  pct2: number;
  /** Percentual do 3o lugar (ex: 10). */
  pct3: number;
  /** Valor em R$ do 1o lugar (opcional). */
  valor1?: number;
  /** Valor em R$ do 2o lugar (opcional). */
  valor2?: number;
  /** Valor em R$ do 3o lugar (opcional). */
  valor3?: number;
  /** Titulo do card. Default: "Premiação Copa 2026". */
  titulo?: string;
}

// Formata valor em R$ (pt-BR). Retorna null se indefinido.
function formatarReal(valor?: number): string | null {
  if (valor === undefined || valor === null) return null;
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

interface ColunaPremio {
  pos: string;
  cor: string;
  pct: number;
  valor?: number;
}

export default function CardPremiacao({
  pct1,
  pct2,
  pct3,
  valor1,
  valor2,
  valor3,
  titulo = "Premiação Copa 2026",
}: CardPremiacaoProps) {
  const colunas: ColunaPremio[] = [
    { pos: "1º", cor: "text-medal-gold", pct: pct1, valor: valor1 },
    { pos: "2º", cor: "text-medal-silver", pct: pct2, valor: valor2 },
    { pos: "3º", cor: "text-medal-bronze", pct: pct3, valor: valor3 },
  ];

  return (
    <section className="bg-surface rounded-xl border border-border p-3 flex flex-col gap-2 relative overflow-hidden">
      {/* Acento de fundo sutil */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container opacity-10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      <h2 className="text-table-header font-table-header text-text-secondary uppercase tracking-wider mb-1">
        {titulo}
      </h2>
      <div className="flex justify-between items-stretch bg-surface-variant rounded-lg p-2 border border-outline-variant">
        {colunas.map((col, i) => {
          const real = formatarReal(col.valor);
          return (
            <div
              key={col.pos}
              className={`flex flex-col items-center gap-1 flex-1 ${
                i < colunas.length - 1
                  ? "border-r border-border border-opacity-50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-1">
                <Icon
                  name="workspace_premium"
                  fill
                  size={16}
                  className={col.cor}
                />
                <span className={`text-label-sm font-label-sm font-bold ${col.cor}`}>
                  {col.pos}
                </span>
              </div>
              <span className="text-body-md font-body-md font-bold text-brand-cream tabular-data">
                {col.pct}%
              </span>
              {real ? (
                <span className="text-[10px] text-text-secondary tabular-data">
                  {real}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
