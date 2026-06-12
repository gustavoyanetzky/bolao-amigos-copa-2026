/**
 * /admin — placeholder do painel.
 * O dashboard real (contadores, premiacao, pendencias) entra na Onda 4.
 * Existe agora so para a rota /admin resolver e validar a casca/auth.
 */
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <span
        className="material-symbols-outlined text-[40px] text-text-secondary"
        aria-hidden="true"
      >
        construction
      </span>
      <h1 className="text-headline-md font-semibold text-text-primary">
        Painel — em construção
      </h1>
      <p className="max-w-xs text-body-md text-text-secondary">
        O dashboard com contadores, premiação e pendências chega em breve.
      </p>
    </div>
  );
}
