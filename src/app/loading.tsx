// Skeleton global mostrado durante a renderizacao das rotas (feedback < 300ms).
// Reaproveitado por todas as rotas que nao definem seu proprio loading.
export default function Loading() {
  return (
    <div
      className="flex-1 flex flex-col gap-3 p-edge-margin"
      role="status"
      aria-label="Carregando"
    >
      {/* Faixa do topo (premiacao/cabecalho) */}
      <div className="h-20 rounded-xl bg-surface border border-border animate-pulse" />
      {/* Linhas de tabela densa */}
      <div className="rounded-xl bg-surface border border-border overflow-hidden divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <div className="h-4 w-5 rounded bg-surface-variant animate-pulse" />
            <div className="h-4 flex-1 rounded bg-surface-variant animate-pulse" />
            <div className="h-4 w-8 rounded bg-surface-variant animate-pulse" />
          </div>
        ))}
      </div>
      <span className="sr-only">Carregando conteúdo…</span>
    </div>
  );
}
