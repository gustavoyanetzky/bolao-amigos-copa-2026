// LadoTime — renderiza um lado de um jogo: ou a selecao (bandeira + codigo/nome),
// ou, quando a selecao ainda nao foi definida (mata-mata placeholder), o rotulo
// de vaga em texto (ex: "1o A", "Venc. Jogo 73"), sem bandeira.
//
// Apresentacional puro (Server Component). Resolve o fallback de codigo null:
// se nao ha selecao, mostra o rotulo em text-text-secondary; sem nada, "A definir".

import Bandeira from "@/components/Bandeira";

interface LadoTimeProps {
  /** Selecao resolvida pelo codigo FIFA. Null quando o time ainda nao existe. */
  selecao?: { codigo: string; nome: string; iso2: string | null } | null;
  /** Rotulo de vaga (mata-mata) exibido quando nao ha selecao. */
  rotulo?: string | null;
  /** Largura da bandeira em px. Default: 20. */
  width?: number;
  /** Alinhamento do texto: "esq" (default) ou "dir". */
  alinhar?: "esq" | "dir";
}

export default function LadoTime({
  selecao,
  rotulo,
  width = 20,
  alinhar = "esq",
}: LadoTimeProps) {
  // Sem selecao -> rotulo de vaga (texto, sem bandeira).
  if (!selecao) {
    return (
      <span
        className={`text-text-secondary text-body-md truncate ${
          alinhar === "dir" ? "text-right" : "text-left"
        }`}
      >
        {rotulo ?? "A definir"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <Bandeira iso2={selecao.iso2} nome={selecao.nome} width={width} />
      <span className="text-on-surface text-body-md truncate">
        {selecao.codigo}
      </span>
    </span>
  );
}
