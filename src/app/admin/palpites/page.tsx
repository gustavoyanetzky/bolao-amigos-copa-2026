import { createClient } from "@/lib/supabase/server";
import type { Jogo, Palpite, Participante, Rodada, Selecao } from "@/lib/types";
import SeletorJogo from "./SeletorJogo";
import GridPalpites from "./GridPalpites";
import AbasModo from "./AbasModo";
import SeletorPalpiteiro from "./SeletorPalpiteiro";
import GridPalpiteiro from "./GridPalpiteiro";
import SeletorRodadas from "@/app/grade/SeletorRodadas";
import Link from "next/link";
import type {
  JogoOpcao,
  LinhaPalpite,
  LinhaJogoPalpite,
  PalpiteiroOpcao,
} from "./tipos";

/**
 * /admin/palpites — lancamento manual de palpites + WO. Dois modos (?modo=):
 * • "jogo" (default) — escolhe um jogo, lanca TODOS os palpiteiros.
 * • "palpiteiro" — escolhe um palpiteiro + rodada, lanca a rodada inteira dele
 *   (casa com o fluxo do WhatsApp: cada palpiteiro manda a rodada de uma vez).
 *
 * Server Component: busca dados via createClient() e delega a parte interativa
 * (selecao, inputs, toggles) a client components na pasta.
 */
export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{
    modo?: string;
    jogo?: string;
    part?: string;
    rodada?: string;
  }>;
}) {
  const { modo: modoParam, jogo, part, rodada } = await searchParams;
  const modo: "jogo" | "palpiteiro" =
    modoParam === "palpiteiro" ? "palpiteiro" : "jogo";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-md font-semibold text-text-primary">
          Palpites
        </h1>
        <p className="text-body-md text-text-secondary">
          {modo === "palpiteiro"
            ? "Lance a rodada inteira de um palpiteiro de uma vez, ou marque WO."
            : "Lance os palpites de cada participante por jogo, ou marque WO."}
        </p>
      </div>

      <AbasModo modo={modo} />

      {modo === "palpiteiro" ? (
        <ModoPalpiteiro partParam={part} rodadaParam={rodada} />
      ) : (
        <ModoJogo jogoParam={jogo} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modo "Por jogo"                                                      */
/* ------------------------------------------------------------------ */

async function ModoJogo({ jogoParam }: { jogoParam?: string }) {
  const supabase = await createClient();

  const [{ data: jogos }, { data: rodadas }, { data: selecoes }] =
    await Promise.all([
      supabase
        .from("jogos")
        .select("*")
        .order("data_hora", { ascending: true })
        .returns<Jogo[]>(),
      supabase.from("rodadas").select("*").returns<Rodada[]>(),
      supabase.from("selecoes").select("*").returns<Selecao[]>(),
    ]);

  const rodadaPorId = new Map((rodadas ?? []).map((r) => [r.id, r]));
  const selecaoPorCod = new Map((selecoes ?? []).map((s) => [s.codigo, s]));

  const jogosOrdenados = [...(jogos ?? [])].sort((a, b) => {
    const oa = rodadaPorId.get(a.rodada_id)?.ordem ?? 0;
    const ob = rodadaPorId.get(b.rodada_id)?.ordem ?? 0;
    if (oa !== ob) return oa - ob;
    return a.data_hora.localeCompare(b.data_hora);
  });

  const opcoes: JogoOpcao[] = jogosOrdenados.map((j) => {
    const casa = j.time_casa_cod ? selecaoPorCod.get(j.time_casa_cod) : null;
    const fora = j.time_fora_cod ? selecaoPorCod.get(j.time_fora_cod) : null;
    // Mata-mata sem time definido: usa o rotulo de vaga como texto do lado.
    const casaTexto = j.time_casa_cod ?? j.rotulo_casa ?? "A definir";
    const foraTexto = j.time_fora_cod ?? j.rotulo_fora ?? "A definir";
    return {
      id: j.id,
      casaCod: casaTexto,
      foraCod: foraTexto,
      casaNome: casa?.nome ?? casaTexto,
      foraNome: fora?.nome ?? foraTexto,
      rodadaNome: rodadaPorId.get(j.rodada_id)?.nome ?? "—",
      encerrado: j.encerrado,
    };
  });

  // Jogo selecionado (default: primeiro da lista, se houver).
  const jogoSelecionadoId =
    jogoParam && opcoes.some((o) => o.id === jogoParam)
      ? jogoParam
      : (opcoes[0]?.id ?? null);

  const jogoSelecionado = jogosOrdenados.find((j) => j.id === jogoSelecionadoId);

  // Linhas (participantes + palpite existente) apenas se ha jogo selecionado.
  let linhas: LinhaPalpite[] = [];
  let jogoEncerrado = false;
  if (jogoSelecionadoId) {
    const [{ data: participantes }, { data: palpites }] = await Promise.all([
      supabase
        .from("participantes")
        .select("id, nome")
        .order("nome", { ascending: true })
        .returns<Pick<Participante, "id" | "nome">[]>(),
      supabase
        .from("palpites")
        .select("*")
        .eq("jogo_id", jogoSelecionadoId)
        .returns<Palpite[]>(),
    ]);

    jogoEncerrado = jogoSelecionado?.encerrado ?? false;

    const palpitePorPart = new Map(
      (palpites ?? []).map((p) => [p.participante_id, p]),
    );

    linhas = (participantes ?? []).map((part) => {
      const p = palpitePorPart.get(part.id);
      return {
        participanteId: part.id,
        nome: part.nome,
        palpiteCasa: p?.palpite_casa ?? null,
        palpiteFora: p?.palpite_fora ?? null,
        wo: p?.wo ?? false,
        temRegistro: !!p,
        pontos: p?.pontos ?? 0,
        cravada: p?.cravada ?? false,
      };
    });
  }

  const casaSel = jogoSelecionado?.time_casa_cod
    ? selecaoPorCod.get(jogoSelecionado.time_casa_cod)
    : undefined;
  const foraSel = jogoSelecionado?.time_fora_cod
    ? selecaoPorCod.get(jogoSelecionado.time_fora_cod)
    : undefined;

  return (
    <>
      <SeletorJogo opcoes={opcoes} jogoSelecionadoId={jogoSelecionadoId} />

      {!jogoSelecionadoId ? (
        <EstadoVazio icone="sports_soccer" texto="Nenhum jogo cadastrado ainda." />
      ) : linhas.length === 0 ? (
        <EstadoVazio icone="group_off" texto="Nenhum participante cadastrado." />
      ) : (
        <GridPalpites
          key={jogoSelecionadoId}
          jogoId={jogoSelecionadoId}
          jogoEncerrado={jogoEncerrado}
          casaCod={
            jogoSelecionado?.time_casa_cod ??
            jogoSelecionado?.rotulo_casa ??
            "A definir"
          }
          foraCod={
            jogoSelecionado?.time_fora_cod ??
            jogoSelecionado?.rotulo_fora ??
            "A definir"
          }
          casaIso2={casaSel?.iso2 ?? null}
          foraIso2={foraSel?.iso2 ?? null}
          casaNome={
            casaSel?.nome ??
            jogoSelecionado?.time_casa_cod ??
            jogoSelecionado?.rotulo_casa ??
            "A definir"
          }
          foraNome={
            foraSel?.nome ??
            jogoSelecionado?.time_fora_cod ??
            jogoSelecionado?.rotulo_fora ??
            "A definir"
          }
          linhas={linhas}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Modo "Por palpiteiro"                                               */
/* ------------------------------------------------------------------ */

/** Horario abreviado (HH:MM) do jogo em horario de Brasilia. */
function formatarHora(dataHora: string): string {
  const d = new Date(dataHora);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

async function ModoPalpiteiro({
  partParam,
  rodadaParam,
}: {
  partParam?: string;
  rodadaParam?: string;
}) {
  const supabase = await createClient();

  // Dados base: rodadas (chips), palpiteiros (seletor), selecoes (bandeiras),
  // datas de jogos (p/ achar a "rodada de hoje").
  const [
    { data: rodadasData },
    { data: participantesData },
    { data: selecoesData },
    { data: jogosDatasData },
  ] = await Promise.all([
    supabase
      .from("rodadas")
      .select("*")
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Rodada[]>(),
    supabase
      .from("participantes")
      .select("id, nome")
      .order("nome", { ascending: true })
      .returns<Pick<Participante, "id" | "nome">[]>(),
    supabase.from("selecoes").select("*").returns<Selecao[]>(),
    supabase
      .from("jogos")
      .select("rodada_id, data_hora")
      .returns<{ rodada_id: string; data_hora: string }[]>(),
  ]);

  const rodadas = rodadasData ?? [];
  const palpiteiros: PalpiteiroOpcao[] = (participantesData ?? []).map((p) => ({
    id: p.id,
    nome: p.nome,
  }));
  const selecaoPorCod = new Map((selecoesData ?? []).map((s) => [s.codigo, s]));

  // Rodada "atual": a primeira (em ordem) cujo ultimo jogo ainda nao passou.
  // Se a Copa ja acabou, cai na ultima rodada. (Mesma logica de /grade.)
  // eslint-disable-next-line react-hooks/purity -- Server Component: roda no servidor, uma vez por request. A regra do React Compiler mira render de cliente.
  const agora = Date.now();
  const ultimoJogoPorRodada = new Map<string, number>();
  for (const j of jogosDatasData ?? []) {
    const t = new Date(j.data_hora).getTime();
    const max = ultimoJogoPorRodada.get(j.rodada_id);
    if (max === undefined || t > max) ultimoJogoPorRodada.set(j.rodada_id, t);
  }
  const rodadaAtual =
    rodadas.find((r) => {
      const max = ultimoJogoPorRodada.get(r.id);
      return max !== undefined && max >= agora;
    }) ??
    rodadas[rodadas.length - 1] ??
    null;

  const rodadaSelecionada =
    rodadas.find((r) => r.id === rodadaParam) ?? rodadaAtual ?? rodadas[0] ?? null;

  // Palpiteiro selecionado (default: primeiro por nome).
  const palpiteiroSelecionadoId =
    partParam && palpiteiros.some((p) => p.id === partParam)
      ? partParam
      : (palpiteiros[0]?.id ?? null);
  const palpiteiroNome =
    palpiteiros.find((p) => p.id === palpiteiroSelecionadoId)?.nome ?? "";

  // Jogos da rodada + palpites desse palpiteiro neles.
  let linhas: LinhaJogoPalpite[] = [];
  if (rodadaSelecionada && palpiteiroSelecionadoId) {
    const { data: jogosRodada } = await supabase
      .from("jogos")
      .select("*")
      .eq("rodada_id", rodadaSelecionada.id)
      .order("data_hora", { ascending: true })
      .returns<Jogo[]>();
    const jogos = jogosRodada ?? [];

    let palpitePorJogo = new Map<string, Palpite>();
    if (jogos.length > 0) {
      const { data: palpites } = await supabase
        .from("palpites")
        .select("*")
        .eq("participante_id", palpiteiroSelecionadoId)
        .in(
          "jogo_id",
          jogos.map((j) => j.id),
        )
        .returns<Palpite[]>();
      palpitePorJogo = new Map((palpites ?? []).map((p) => [p.jogo_id, p]));
    }

    linhas = jogos.map((j) => {
      const casa = j.time_casa_cod ? selecaoPorCod.get(j.time_casa_cod) : null;
      const fora = j.time_fora_cod ? selecaoPorCod.get(j.time_fora_cod) : null;
      const p = palpitePorJogo.get(j.id);
      return {
        jogoId: j.id,
        casa: {
          codigo: j.time_casa_cod,
          nome: casa?.nome ?? null,
          iso2: casa?.iso2 ?? null,
          rotulo: j.rotulo_casa,
        },
        fora: {
          codigo: j.time_fora_cod,
          nome: fora?.nome ?? null,
          iso2: fora?.iso2 ?? null,
          rotulo: j.rotulo_fora,
        },
        hora: formatarHora(j.data_hora),
        encerrado: j.encerrado,
        palpiteCasa: p?.palpite_casa ?? null,
        palpiteFora: p?.palpite_fora ?? null,
        wo: p?.wo ?? false,
        temRegistro: !!p,
        pontos: p?.pontos ?? 0,
        cravada: p?.cravada ?? false,
      };
    });
  }

  const idxRodada = rodadaSelecionada
    ? rodadas.findIndex((r) => r.id === rodadaSelecionada.id)
    : -1;

  // Helper p/ montar href das setas preservando o palpiteiro.
  const hrefRodada = (rid: string) =>
    `/admin/palpites?modo=palpiteiro${
      palpiteiroSelecionadoId ? `&part=${palpiteiroSelecionadoId}` : ""
    }&rodada=${rid}`;
  const rodadaAnterior = idxRodada > 0 ? rodadas[idxRodada - 1] : null;
  const rodadaProxima =
    idxRodada >= 0 && idxRodada < rodadas.length - 1
      ? rodadas[idxRodada + 1]
      : null;

  return (
    <>
      <SeletorPalpiteiro
        opcoes={palpiteiros}
        selecionadoId={palpiteiroSelecionadoId}
        rodadaId={rodadaSelecionada?.id ?? null}
      />

      {rodadas.length > 0 && (
        <div className="-mx-edge-margin overflow-hidden rounded-xl border border-border">
          {/* Cabecalho da rodada com setas */}
          <div className="flex items-center justify-between border-b border-border bg-surface-container-low px-edge-margin py-2">
            {rodadaAnterior ? (
              <Link
                href={hrefRodada(rodadaAnterior.id)}
                aria-label="Rodada anterior"
                className="p-1 text-text-secondary transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  chevron_left
                </span>
              </Link>
            ) : (
              <span className="w-9 p-1 text-disabled" aria-hidden="true">
                <span className="material-symbols-outlined">chevron_left</span>
              </span>
            )}

            <div className="flex min-w-0 flex-col items-center px-2">
              <span className="text-table-header font-bold uppercase tracking-widest text-text-secondary">
                {rodadaSelecionada
                  ? `Rodada ${idxRodada + 1} de ${rodadas.length}`
                  : "Sem rodadas"}
              </span>
              <span className="max-w-full truncate text-body-md font-semibold text-text-primary">
                {rodadaSelecionada?.nome ?? "—"}
                {rodadaSelecionada?.invalidada ? " (invalidada)" : ""}
              </span>
            </div>

            {rodadaProxima ? (
              <Link
                href={hrefRodada(rodadaProxima.id)}
                aria-label="Próxima rodada"
                className="p-1 text-text-secondary transition-colors hover:text-primary"
              >
                <span className="material-symbols-outlined" aria-hidden="true">
                  chevron_right
                </span>
              </Link>
            ) : (
              <span className="w-9 p-1 text-disabled" aria-hidden="true">
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
            )}
          </div>

          {/* Chips rolaveis (• = rodada de hoje); preserva modo + palpiteiro. */}
          <SeletorRodadas
            rodadas={rodadas.map((r) => ({ id: r.id, nome: r.nome }))}
            selecionadaId={rodadaSelecionada?.id ?? null}
            atualId={rodadaAtual?.id ?? null}
            basePath="/admin/palpites"
            params={{
              modo: "palpiteiro",
              ...(palpiteiroSelecionadoId
                ? { part: palpiteiroSelecionadoId }
                : {}),
            }}
          />
        </div>
      )}

      {palpiteiros.length === 0 ? (
        <EstadoVazio icone="group_off" texto="Nenhum participante cadastrado." />
      ) : linhas.length === 0 ? (
        <EstadoVazio
          icone="sports_soccer"
          texto="Nenhum jogo nesta rodada."
        />
      ) : (
        <GridPalpiteiro
          key={`${palpiteiroSelecionadoId}:${rodadaSelecionada?.id}`}
          participanteId={palpiteiroSelecionadoId as string}
          participanteNome={palpiteiroNome}
          linhas={linhas}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function EstadoVazio({ icone, texto }: { icone: string; texto: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-edge-margin py-12 text-center">
      <span
        className="material-symbols-outlined text-[36px] text-text-secondary"
        aria-hidden="true"
      >
        {icone}
      </span>
      <p className="text-body-md text-text-secondary">{texto}</p>
    </div>
  );
}
