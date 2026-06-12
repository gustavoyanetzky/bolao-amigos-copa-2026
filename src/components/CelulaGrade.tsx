// CelulaGrade — celula da matriz participante x jogo (grade publica).
// Estados:
//  - cravada     -> verde (placar exato): destaque emerald + pontos "+X"
//  - acerto      -> neutro com pontos "+X" em primary
//  - erro        -> neutro apagado, pontos "0"
//  - wo          -> vermelho, mostra "WO" e "-1" (ou pts_wo)
//  - invalidado  -> cinza riscado, mostra "—"
//  - vazio       -> "—" (sem palpite / jogo futuro)
// Mostra o placar (casa x fora) em cima e os pontos pequenos embaixo.
// Apresentacional puro. Conforme mockup 03.

export type EstadoCelula =
  | "cravada"
  | "acerto"
  | "erro"
  | "wo"
  | "invalidado"
  | "vazio";

interface CelulaGradeProps {
  estado: EstadoCelula;
  /** Placar palpitado — mandante. */
  casa?: number | null;
  /** Placar palpitado — visitante. */
  fora?: number | null;
  /** Pontos do palpite neste jogo (ex: 2, 1, 0, -1). */
  pontos?: number;
}

// Formata o placar "casa x fora", ou "—" se incompleto.
function formatarPlacar(
  casa?: number | null,
  fora?: number | null,
): string {
  if (casa === null || casa === undefined || fora === null || fora === undefined) {
    return "—";
  }
  return `${casa} x ${fora}`;
}

// Formata os pontos com sinal: "+2", "0", "-1".
function formatarPontos(pontos?: number): string {
  if (pontos === undefined) return "";
  if (pontos > 0) return `+${pontos}`;
  return `${pontos}`;
}

export default function CelulaGrade({
  estado,
  casa,
  fora,
  pontos,
}: CelulaGradeProps) {
  const placar = formatarPlacar(casa, fora);
  const pontosFmt = formatarPontos(pontos);

  // INVALIDADO — cinza riscado.
  if (estado === "invalidado") {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-disabled line-through tracking-widest text-[14px]">
          —
        </span>
      </div>
    );
  }

  // VAZIO — sem palpite / jogo futuro.
  if (estado === "vazio") {
    return (
      <div className="flex flex-col items-center justify-center">
        <span className="text-text-secondary tracking-widest text-[14px]">
          —
        </span>
      </div>
    );
  }

  // WO — vermelho, mostra "WO" e "-1".
  if (estado === "wo") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <div className="w-full h-full absolute inset-0 bg-error-red/10 border border-error-red/30 m-[2px] rounded pointer-events-none" />
        <span className="relative text-error-red font-bold tracking-widest text-[14px]">
          WO
        </span>
        <span className="relative text-[9px] text-error-red font-bold bg-error-red/20 px-1 rounded-sm mt-0.5 tabular-data">
          {pontosFmt || "-1"}
        </span>
      </div>
    );
  }

  // CRAVADA — verde com destaque.
  if (estado === "cravada") {
    return (
      <div className="relative flex flex-col items-center justify-center">
        <div className="w-full h-full absolute inset-0 bg-success-emerald/10 border border-success-emerald/30 m-[2px] rounded pointer-events-none" />
        <span className="relative text-on-surface font-bold tracking-widest text-[14px] tabular-data">
          {placar}
        </span>
        {pontosFmt ? (
          <span className="relative text-[9px] text-success-emerald font-bold bg-success-emerald/20 px-1 rounded-sm mt-0.5 tabular-data">
            {pontosFmt}
          </span>
        ) : null}
      </div>
    );
  }

  // ERRO — neutro apagado.
  if (estado === "erro") {
    return (
      <div className="flex flex-col items-center justify-center opacity-70">
        <span className="text-text-secondary tracking-widest text-[14px] tabular-data">
          {placar}
        </span>
        <span className="text-[9px] text-text-secondary mt-0.5 tabular-data">
          {pontosFmt || "0"}
        </span>
      </div>
    );
  }

  // ACERTO — neutro com pontos em primary.
  return (
    <div className="flex flex-col items-center justify-center">
      <span className="text-on-surface-variant tracking-widest text-[14px] tabular-data">
        {placar}
      </span>
      {pontosFmt ? (
        <span className="text-[9px] text-primary mt-0.5 tabular-data">
          {pontosFmt}
        </span>
      ) : null}
    </div>
  );
}
