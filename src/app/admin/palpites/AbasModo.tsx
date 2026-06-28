import Link from "next/link";

/**
 * Abas de modo de lancamento (/admin/palpites):
 * • "Por jogo" — escolhe um jogo, lanca todos os palpiteiros (default).
 * • "Por palpiteiro" — escolhe um palpiteiro, lanca a rodada inteira dele.
 *
 * Server Component puro: cada aba e um Link que troca ?modo=. Nao preserva
 * jogo/part/rodada de proposito — cada modo abre no seu default.
 */
export default function AbasModo({
  modo,
}: {
  modo: "jogo" | "palpiteiro";
}) {
  const abas = [
    { id: "jogo", label: "Por jogo", icone: "sports_soccer" },
    { id: "palpiteiro", label: "Por palpiteiro", icone: "person" },
  ] as const;

  return (
    <div
      role="tablist"
      aria-label="Modo de lançamento"
      className="flex gap-1 rounded-xl border border-border bg-surface-container-low p-1"
    >
      {abas.map((aba) => {
        const ativa = aba.id === modo;
        return (
          <Link
            key={aba.id}
            href={`/admin/palpites?modo=${aba.id}`}
            role="tab"
            aria-selected={ativa}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-label-md font-medium transition-colors ${
              ativa
                ? "bg-primary text-on-primary"
                : "text-text-secondary hover:bg-surface-variant hover:text-text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              {aba.icone}
            </span>
            {aba.label}
          </Link>
        );
      })}
    </div>
  );
}
