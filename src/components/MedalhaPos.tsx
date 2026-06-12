// MedalhaPos — exibe a posicao na classificacao.
// Top 3: medalha (workspace_premium) nas cores ouro/prata/bronze, com
// halo sutil. Demais posicoes: numero em text-secondary.
// Apresentacional puro. Conforme mockup 01.

import Icon from "./Icon";

interface MedalhaPosProps {
  /** Posicao 1..n. */
  posicao: number;
}

const CORES_MEDALHA: Record<number, string> = {
  1: "text-medal-gold",
  2: "text-medal-silver",
  3: "text-medal-bronze",
};

export default function MedalhaPos({ posicao }: MedalhaPosProps) {
  const cor = CORES_MEDALHA[posicao];

  // Top 3 — medalha com numero por cima e halo de fundo.
  if (cor) {
    return (
      <span className="flex justify-center items-center relative">
        <span className={`absolute opacity-20 scale-150 z-0 ${cor}`}>
          <Icon name="workspace_premium" fill size={24} />
        </span>
        <span className={`text-data-cell font-data-cell font-bold z-10 tabular-data ${cor}`}>
          {posicao}
        </span>
      </span>
    );
  }

  // Demais — apenas o numero.
  return (
    <span className="flex justify-center items-center">
      <span className="text-data-cell font-data-cell text-text-secondary tabular-data">
        {posicao}
      </span>
    </span>
  );
}
