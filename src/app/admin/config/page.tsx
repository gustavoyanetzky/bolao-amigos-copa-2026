import { createClient } from "@/lib/supabase/server";
import type { Config, Selecao } from "@/lib/types";
import FormPontuacao from "./FormPontuacao";
import FormPremiacao from "./FormPremiacao";
import FormCampeao from "./FormCampeao";

export const dynamic = "force-dynamic";

function Secao({
  icone,
  iconeBg,
  iconeCor,
  titulo,
  children,
}: {
  icone: string;
  iconeBg: string;
  iconeCor: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <header className="flex items-center gap-3 border-b border-border bg-surface-variant px-4 py-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded ${iconeBg} ${iconeCor}`}
        >
          <span
            className="material-symbols-outlined text-base"
            aria-hidden="true"
          >
            {icone}
          </span>
        </div>
        <h2 className="text-body-lg font-semibold text-primary">{titulo}</h2>
      </header>
      {children}
    </section>
  );
}

export default async function ConfigPage() {
  const supabase = await createClient();

  const [{ data: config }, { data: selecoes }] = await Promise.all([
    supabase.from("config").select("*").eq("id", 1).single<Config>(),
    supabase
      .from("selecoes")
      .select("*")
      .order("nome", { ascending: true })
      .returns<Selecao[]>(),
  ]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span
          className="material-symbols-outlined text-[40px] text-error-red"
          aria-hidden="true"
        >
          error
        </span>
        <h1 className="text-headline-md font-semibold text-text-primary">
          Configuração não encontrada
        </h1>
        <p className="max-w-xs text-body-md text-text-secondary">
          O registro singleton de configuração (id=1) não existe no banco.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="hidden md:block">
        <h1 className="text-headline-lg font-semibold text-primary">
          Configurações gerais
        </h1>
        <p className="mt-1 text-body-md text-text-secondary">
          Regras de pontuação, premiação e definições do campeonato.
        </p>
      </header>

      <Secao
        icone="score"
        iconeBg="bg-primary-container"
        iconeCor="text-on-primary-container"
        titulo="Regras de pontuação"
      >
        <FormPontuacao config={config} />
      </Secao>

      <Secao
        icone="emoji_events"
        iconeBg="bg-tertiary/20"
        iconeCor="text-tertiary"
        titulo="Premiação & cotas"
      >
        <FormPremiacao config={config} />
      </Secao>

      <Secao
        icone="sports_soccer"
        iconeBg="bg-success-emerald/20"
        iconeCor="text-success-emerald"
        titulo="Aposta de campeão"
      >
        <FormCampeao config={config} selecoes={selecoes ?? []} />
      </Secao>
    </div>
  );
}
