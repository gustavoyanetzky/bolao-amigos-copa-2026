/**
 * /admin/jogos — gerenciamento de jogos (admin).
 * Server Component: busca rodadas, selecoes e jogos (filtrados por rodada
 * via ?rodada=) com createClient(). As partes interativas (filtro, forms,
 * toggles) sao Client Components pequenos nesta mesma pasta.
 *
 * thin client / fat server: nada de chave/logica sensivel no client; toda
 * mutacao passa pelas Server Actions de '@/app/actions/jogos'.
 */

import Badge from "@/components/Badge";
import { createClient } from "@/lib/supabase/server";
import type { Fase, Jogo, Rodada, Selecao } from "@/lib/types";
import FiltroRodada from "./FiltroRodada";
import FormJogo from "./FormJogo";
import LinhaJogo from "./LinhaJogo";

export const dynamic = "force-dynamic";

const ROTULO_FASE: Record<Fase, string> = {
  grupos: "Fase de grupos",
  "16avos": "16-avos",
  oitavas: "Oitavas",
  quartas: "Quartas",
  semi: "Semifinal",
  terceiro: "3º lugar",
  final: "Final",
};

/** Mapa codigo -> selecao, para resolver bandeiras e nomes nas linhas. */
function indexarSelecoes(selecoes: Selecao[]): Map<string, Selecao> {
  return new Map(selecoes.map((s) => [s.codigo, s]));
}

export default async function AdminJogosPage({
  searchParams,
}: {
  searchParams: Promise<{ rodada?: string }>;
}) {
  const { rodada: rodadaParam } = await searchParams;
  const supabase = await createClient();

  const [{ data: rodadasData }, { data: selecoesData }] = await Promise.all([
    supabase
      .from("rodadas")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Rodada[]>(),
    supabase
      .from("selecoes")
      .select("*")
      .order("nome", { ascending: true })
      .returns<Selecao[]>(),
  ]);

  const rodadas = rodadasData ?? [];
  const selecoes = selecoesData ?? [];
  const porCodigo = indexarSelecoes(selecoes);

  // Rodada selecionada: a do query string (se valida) ou a primeira.
  const rodadaSelecionada =
    rodadas.find((r) => r.id === rodadaParam)?.id ?? rodadas[0]?.id ?? null;

  let jogos: Jogo[] = [];
  if (rodadaSelecionada) {
    const { data: jogosData } = await supabase
      .from("jogos")
      .select("*")
      .eq("rodada_id", rodadaSelecionada)
      .order("data_hora", { ascending: true })
      .returns<Jogo[]>();
    jogos = jogosData ?? [];
  }

  const rodadaAtual = rodadas.find((r) => r.id === rodadaSelecionada) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Cabecalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-headline-md font-semibold text-text-primary">
          Jogos
        </h1>
        {rodadaAtual?.invalidada && (
          <Badge variante="invalidado">Rodada anulada</Badge>
        )}
      </div>

      {/* Filtro de rodadas (client) */}
      {rodadas.length > 0 ? (
        <FiltroRodada
          rodadas={rodadas.map((r) => ({ id: r.id, nome: r.nome }))}
          selecionada={rodadaSelecionada}
        />
      ) : (
        <p className="rounded-xl border border-border bg-surface p-4 text-body-md text-text-secondary">
          Nenhuma rodada cadastrada ainda. Crie rodadas em{" "}
          <span className="text-text-primary">Rodadas</span> antes de
          adicionar jogos.
        </p>
      )}

      {/* Lista de jogos da rodada */}
      <section className="flex flex-col gap-3">
        {rodadaSelecionada && jogos.length === 0 && (
          <p className="rounded-xl border border-border bg-surface p-4 text-center text-body-md text-text-secondary">
            Nenhum jogo nesta rodada. Adicione abaixo.
          </p>
        )}

        {jogos.map((jogo) => {
          const casa = jogo.time_casa_cod
            ? (porCodigo.get(jogo.time_casa_cod) ?? null)
            : null;
          const fora = jogo.time_fora_cod
            ? (porCodigo.get(jogo.time_fora_cod) ?? null)
            : null;
          return (
            <LinhaJogo
              key={jogo.id}
              jogo={jogo}
              casa={casa}
              fora={fora}
              rotuloFase={jogo.fase ? ROTULO_FASE[jogo.fase] : null}
              rodadas={rodadas.map((r) => ({ id: r.id, nome: r.nome }))}
              selecoes={selecoes.map((s) => ({
                codigo: s.codigo,
                nome: s.nome,
              }))}
            />
          );
        })}
      </section>

      {/* Adicionar jogo */}
      {rodadas.length > 0 && (
        <FormJogo
          rodadas={rodadas.map((r) => ({ id: r.id, nome: r.nome }))}
          selecoes={selecoes.map((s) => ({ codigo: s.codigo, nome: s.nome }))}
          rodadaPadrao={rodadaSelecionada}
        />
      )}
    </div>
  );
}
