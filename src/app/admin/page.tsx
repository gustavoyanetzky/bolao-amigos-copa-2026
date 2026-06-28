/**
 * /admin — dashboard administrativo (Onda 4).
 * Server Component autenticado (a casca/auth/nav vive em layout.tsx).
 *
 * thin client / fat server: todas as leituras acontecem aqui via createClient()
 * (RLS permite ao authenticated ler as tabelas cruas). Dispara as contagens e
 * listas em paralelo, deriva a premiacao com premiacao() e renderiza cards de
 * resumo, premiacao, pendencias, proximos jogos e atalhos. Conforme mockup 06.
 */

import Link from "next/link";
import LadoTime from "@/components/LadoTime";
import CardPremiacao from "@/components/CardPremiacao";
import Icon from "@/components/Icon";
import { premiacao } from "@/lib/ranking";
import { createClient } from "@/lib/supabase/server";
import type { Config, Jogo, Selecao } from "@/lib/types";

export const dynamic = "force-dynamic";

// Conta linhas de uma tabela aplicando um eq opcional, usando head+count exato.
type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

function contar(
  supabase: SupabaseClient,
  tabela: string,
  filtro?: { coluna: string; valor: boolean },
) {
  let query = supabase
    .from(tabela)
    .select("*", { count: "exact", head: true });
  if (filtro) query = query.eq(filtro.coluna, filtro.valor);
  return query;
}

// Formata data/hora de jogo em pt-BR curto (ex: "12/06 16:00").
function formatarDataHora(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  const hora = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
  return `${data} · ${hora}`;
}

// --- Subcomponentes apresentacionais ---------------------------------------

function CardResumo({
  rotulo,
  valor,
  icone,
  cor,
  alerta = false,
}: {
  rotulo: string;
  valor: number;
  icone: string;
  cor: string;
  alerta?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border bg-surface p-4 ${
        alerta ? "border-error-red/60" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-label-sm font-medium uppercase tracking-wider ${
            alerta ? "text-error-red" : "text-text-secondary"
          }`}
        >
          {rotulo}
        </span>
        <Icon name={icone} fill size={20} className={cor} />
      </div>
      <span
        className={`text-[32px] font-bold leading-none tabular-data ${cor}`}
      >
        {valor}
      </span>
    </div>
  );
}

function AtalhoGrande({
  href,
  rotulo,
  icone,
}: {
  href: string;
  rotulo: string;
  icone: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-3 text-primary transition-transform hover:border-primary active:scale-95"
    >
      <Icon name={icone} fill size={26} />
      <span className="text-label-sm font-medium text-center leading-tight">
        {rotulo}
      </span>
    </Link>
  );
}

// --- Pagina -----------------------------------------------------------------

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const agora = new Date().toISOString();

  const [
    { count: totalParticipantes },
    { count: totalPagos },
    { count: totalRodadas },
    { count: totalJogos },
    { count: totalSemResultado },
    { data: config },
    { data: jogosApurarData },
    { count: semCampea },
    { data: proximosData },
    { data: selecoesData },
  ] = await Promise.all([
    // Contadores
    contar(supabase, "participantes"),
    contar(supabase, "participantes", { coluna: "pago", valor: true }),
    contar(supabase, "rodadas"),
    contar(supabase, "jogos"),
    contar(supabase, "jogos", { coluna: "encerrado", valor: false }),
    // Config singleton (premiacao)
    supabase.from("config").select("*").eq("id", 1).single<Config>(),
    // Pendencia: jogos ja iniciados (data < agora) e ainda nao encerrados.
    supabase
      .from("jogos")
      .select("id")
      .lt("data_hora", agora)
      .eq("encerrado", false)
      .returns<Pick<Jogo, "id">[]>(),
    // Pendencia: participantes sem campea palpitada (so relevante antes do prazo).
    supabase
      .from("participantes")
      .select("*", { count: "exact", head: true })
      .is("selecao_campea", null),
    // Proximos jogos: a partir de agora, asc, ate 5.
    supabase
      .from("jogos")
      .select("*")
      .gte("data_hora", agora)
      .order("data_hora", { ascending: true })
      .limit(5)
      .returns<Jogo[]>(),
    // Selecoes p/ resolver bandeiras dos proximos jogos.
    supabase.from("selecoes").select("*").returns<Selecao[]>(),
  ]);

  const participantes = totalParticipantes ?? 0;
  const pagos = totalPagos ?? 0;
  const rodadas = totalRodadas ?? 0;
  const jogos = totalJogos ?? 0;
  const semResultado = totalSemResultado ?? 0;
  const jogosApurar = jogosApurarData?.length ?? 0;
  const semCampeaCount = semCampea ?? 0;

  const proximos = proximosData ?? [];
  const selecoes = selecoesData ?? [];
  const porCodigo = new Map(selecoes.map((s) => [s.codigo, s]));

  // Prazo de aposta de campeao: so cobramos "sem campea" se ainda nao venceu.
  const prazoCampeaoAberto = config?.prazo_campeao
    ? new Date(config.prazo_campeao) > new Date(agora)
    : false;
  const mostrarPendenciaCampea = prazoCampeaoAberto && semCampeaCount > 0;

  // Premiacao derivada (R$ se valor_cota setado, senao so percentuais).
  const premio = premiacao({
    pagosCount: pagos,
    valorCota: config?.valor_cota ?? null,
    pct1: config?.pct_1 ?? 0,
    pct2: config?.pct_2 ?? 0,
    pct3: config?.pct_3 ?? 0,
  });

  const temPendencias = jogosApurar > 0 || mostrarPendenciaCampea;

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecalho */}
      <header className="flex flex-col gap-1">
        <h1 className="text-headline-lg font-semibold text-primary">
          Painel
        </h1>
        <p className="text-body-md text-text-secondary">
          Visão geral do bolão da Copa 2026.
        </p>
      </header>

      {/* Cards de resumo */}
      <section className="grid grid-cols-2 gap-3">
        <CardResumo
          rotulo="Participantes"
          valor={participantes}
          icone="groups"
          cor="text-primary-fixed"
        />
        <CardResumo
          rotulo="Pagos"
          valor={pagos}
          icone="payments"
          cor="text-success-emerald"
        />
        <CardResumo
          rotulo="Rodadas"
          valor={rodadas}
          icone="calendar_today"
          cor="text-tertiary"
        />
        <CardResumo
          rotulo="Jogos"
          valor={jogos}
          icone="sports_soccer"
          cor="text-on-surface"
        />
        <CardResumo
          rotulo="Sem result."
          valor={semResultado}
          icone="warning"
          cor="text-error-red"
          alerta={semResultado > 0}
        />
      </section>

      {/* Premiacao */}
      <section className="flex flex-col gap-2">
        <CardPremiacao
          titulo="Premiação"
          pct1={premio.percentuais[0]}
          pct2={premio.percentuais[1]}
          pct3={premio.percentuais[2]}
          valor1={premio.premios?.[0]}
          valor2={premio.premios?.[1]}
          valor3={premio.premios?.[2]}
        />
        {premio.arrecadado != null ? (
          <p className="px-1 text-label-sm text-text-secondary">
            Arrecadado:{" "}
            <span className="font-bold text-primary-fixed tabular-data">
              {premio.arrecadado.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </span>{" "}
            ({pagos} {pagos === 1 ? "cota paga" : "cotas pagas"})
          </p>
        ) : (
          <p className="px-1 text-label-sm text-text-secondary">
            Defina o valor da cota em{" "}
            <Link href="/admin/config" className="text-primary underline">
              Config
            </Link>{" "}
            para ver os prêmios em R$.
          </p>
        )}
      </section>

      {/* Pendencias */}
      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-semibold text-primary">Pendências</h2>
        {temPendencias ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {jogosApurar > 0 && (
              <Link
                href="/admin/jogos"
                className="flex items-center justify-between border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-variant"
              >
                <div className="flex items-center gap-3">
                  <Icon name="error" fill size={20} className="text-error-red" />
                  <span className="text-body-md text-on-surface">
                    Jogos a apurar ({jogosApurar})
                  </span>
                </div>
                <Icon
                  name="chevron_right"
                  size={20}
                  className="text-text-secondary"
                />
              </Link>
            )}
            {mostrarPendenciaCampea && (
              <Link
                href="/admin/participantes"
                className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-surface-variant"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    name="emoji_events"
                    fill
                    size={20}
                    className="text-tertiary"
                  />
                  <span className="text-body-md text-on-surface">
                    Sem palpite de campeã ({semCampeaCount})
                  </span>
                </div>
                <Icon
                  name="chevron_right"
                  size={20}
                  className="text-text-secondary"
                />
              </Link>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <Icon
              name="task_alt"
              fill
              size={20}
              className="text-success-emerald"
            />
            <span className="text-body-md text-text-secondary">
              Nada pendente por agora.
            </span>
          </div>
        )}
      </section>

      {/* Proximos jogos */}
      <section className="flex flex-col gap-3">
        <h2 className="text-body-lg font-semibold text-primary">
          Próximos jogos
        </h2>
        {proximos.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            {proximos.map((jogo) => {
              const casa = jogo.time_casa_cod
                ? (porCodigo.get(jogo.time_casa_cod) ?? null)
                : null;
              const fora = jogo.time_fora_cod
                ? (porCodigo.get(jogo.time_fora_cod) ?? null)
                : null;
              return (
                <div
                  key={jogo.id}
                  className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <LadoTime selecao={casa} rotulo={jogo.rotulo_casa} width={20} />
                    <span className="text-label-sm text-text-secondary">×</span>
                    <LadoTime selecao={fora} rotulo={jogo.rotulo_fora} width={20} />
                  </div>
                  <span className="shrink-0 text-label-sm text-text-secondary tabular-data">
                    {formatarDataHora(jogo.data_hora)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <Icon
              name="event_busy"
              size={20}
              className="text-text-secondary"
            />
            <span className="text-body-md text-text-secondary">
              Nenhum jogo futuro agendado.
            </span>
          </div>
        )}
      </section>

      {/* Atalhos grandes */}
      <section className="grid grid-cols-3 gap-3">
        <AtalhoGrande
          href="/admin/participantes"
          rotulo="Participantes"
          icone="group_add"
        />
        <AtalhoGrande href="/admin/jogos" rotulo="Jogos" icone="sports_soccer" />
        <AtalhoGrande
          href="/admin/palpites"
          rotulo="Palpites"
          icone="edit_note"
        />
      </section>
    </div>
  );
}
