import { createClient } from "@/lib/supabase/server";
import type { Jogo, Palpite, Participante, Rodada, Selecao } from "@/lib/types";
import SeletorJogo from "./SeletorJogo";
import GridPalpites from "./GridPalpites";
import type { JogoOpcao, LinhaPalpite } from "./tipos";

/**
 * /admin/palpites — lancamento manual de palpites + WO (modo "Por jogo").
 * Server Component: busca dados via createClient() e delega a parte
 * interativa (selecao de jogo, inputs, toggles) a client components na pasta.
 *
 * Fluxo: escolhe um jogo (?jogo=<id>) -> grid de TODOS os participantes com
 * placar casa x fora + toggle WO por linha; botao "marcar faltantes como WO".
 */
export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ jogo?: string }>;
}) {
  const { jogo: jogoIdParam } = await searchParams;
  const supabase = await createClient();

  // Jogos + rodadas + selecoes para montar o seletor.
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
    jogoIdParam && opcoes.some((o) => o.id === jogoIdParam)
      ? jogoIdParam
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

  const casaSel =
    jogoSelecionado?.time_casa_cod
      ? selecaoPorCod.get(jogoSelecionado.time_casa_cod)
      : undefined;
  const foraSel =
    jogoSelecionado?.time_fora_cod
      ? selecaoPorCod.get(jogoSelecionado.time_fora_cod)
      : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-md font-semibold text-text-primary">
          Palpites
        </h1>
        <p className="text-body-md text-text-secondary">
          Lance os palpites de cada participante por jogo, ou marque WO.
        </p>
      </div>

      <SeletorJogo opcoes={opcoes} jogoSelecionadoId={jogoSelecionadoId} />

      {!jogoSelecionadoId ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-edge-margin py-12 text-center">
          <span
            className="material-symbols-outlined text-[36px] text-text-secondary"
            aria-hidden="true"
          >
            sports_soccer
          </span>
          <p className="text-body-md text-text-secondary">
            Nenhum jogo cadastrado ainda.
          </p>
        </div>
      ) : linhas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface px-edge-margin py-12 text-center">
          <span
            className="material-symbols-outlined text-[36px] text-text-secondary"
            aria-hidden="true"
          >
            group_off
          </span>
          <p className="text-body-md text-text-secondary">
            Nenhum participante cadastrado.
          </p>
        </div>
      ) : (
        <GridPalpites
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
    </div>
  );
}
