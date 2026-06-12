import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";
import type { Config, Participante, Selecao } from "@/lib/types";
import FormParticipante from "./FormParticipante";
import LinhaParticipante from "./LinhaParticipante";

/**
 * /admin/participantes — Server Component.
 * Lista participantes (nome, contato, status pago, selecao campea),
 * busca por nome, e CRUD via Server Actions.
 *
 * Dados sensiveis (contato, pago) sao admin-only — esta rota e protegida
 * pelo guard em /admin/layout.tsx.
 */

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ParticipantesPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const busca = (q ?? "").trim();

  const supabase = await createClient();

  // Participantes (com filtro por nome, se houver busca).
  let query = supabase
    .from("participantes")
    .select("*")
    .order("nome", { ascending: true });
  if (busca) {
    query = query.ilike("nome", `%${busca}%`);
  }
  const { data: participantes } = await query.returns<Participante[]>();

  // Selecoes para popular o seletor de campea.
  const { data: selecoes } = await supabase
    .from("selecoes")
    .select("*")
    .order("nome", { ascending: true })
    .returns<Selecao[]>();

  // Prazo de campea: se ja passou, bloqueia a edicao no client tambem.
  const { data: config } = await supabase
    .from("config")
    .select("prazo_campeao")
    .eq("id", 1)
    .single<Pick<Config, "prazo_campeao">>();

  const prazoExpirado = config?.prazo_campeao
    ? Date.now() > new Date(config.prazo_campeao).getTime()
    : false;

  const lista = participantes ?? [];
  const selecoesLista = selecoes ?? [];
  const total = lista.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecalho + contador */}
      <div className="flex items-center justify-between">
        <h1 className="text-headline-lg font-semibold text-text-primary">
          Participantes
        </h1>
        <span className="rounded-md bg-surface-variant px-2 py-1 text-label-sm font-medium text-text-secondary">
          {total} {total === 1 ? "ativo" : "ativos"}
        </span>
      </div>

      {/* Busca por nome (GET, sem JS) */}
      <form method="get" className="relative w-full">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary">
          <Icon name="search" size={18} />
        </span>
        <input
          type="text"
          name="q"
          defaultValue={busca}
          placeholder="Buscar participante..."
          aria-label="Buscar participante"
          className="block w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-3 text-body-md text-text-primary placeholder-text-secondary transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </form>

      {/* Adicionar participante */}
      <FormParticipante
        modo="criar"
        selecoes={selecoesLista}
        prazoExpirado={prazoExpirado}
      />

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center">
          <Icon
            name="group_off"
            size={36}
            className="text-text-secondary"
          />
          <p className="text-body-md text-text-secondary">
            {busca
              ? "Nenhum participante encontrado para esta busca."
              : "Nenhum participante cadastrado ainda."}
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {lista.map((p, i) => (
            <LinhaParticipante
              key={p.id}
              participante={p}
              selecoes={selecoesLista}
              prazoExpirado={prazoExpirado}
              zebra={i % 2 === 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
