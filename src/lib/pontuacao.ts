// Logica de pontuacao do Bolao (funcao pura, server-side).
// Espelha a spec, secao 2.1. Sem deps de UI nem de Supabase: recebe
// apenas os dados necessarios e devolve { pontos, cravada }.

import type { Palpite, Jogo, Rodada, Config } from "./types";

// Params estreitos: so os campos que a regra realmente usa.
type PalpitePontuavel = Pick<Palpite, "palpite_casa" | "palpite_fora" | "wo">;
type JogoPontuavel = Pick<
  Jogo,
  "classico" | "invalidado" | "encerrado" | "placar_casa" | "placar_fora"
>;
type RodadaPontuavel = Pick<Rodada, "invalidada">;
type ConfigPontuavel = Pick<
  Config,
  | "pts_acerto"
  | "pts_cravada"
  | "pts_acerto_classico"
  | "pts_cravada_classico"
  | "pts_wo"
>;

export interface ResultadoPontuacao {
  pontos: number;
  cravada: boolean;
}

/**
 * Calcula os pontos de um palpite para um jogo (secao 2.1 da spec).
 * Tiers excludentes; nao inclui bonus de campeao (derivado no ranking).
 */
export function pontosDoPalpite(
  palpite: PalpitePontuavel,
  jogo: JogoPontuavel,
  rodada: RodadaPontuavel,
  config: ConfigPontuavel,
): ResultadoPontuacao {
  // 1) Jogo ou rodada invalidados -> nao pontua.
  if (jogo.invalidado || rodada.invalidada) {
    return { pontos: 0, cravada: false };
  }

  // 2) WO marcado pelo admin -> penalidade fixa (pts_wo, ex: -1).
  if (palpite.wo) {
    return { pontos: config.pts_wo, cravada: false };
  }

  // 3) Jogo ainda nao encerrado (resultado nao lancado) -> sem pontos.
  if (!jogo.encerrado) {
    return { pontos: 0, cravada: false };
  }

  // 4) Guarda contra placares/palpites nulos (jogo encerrado deveria ter
  //    placar, mas tratamos null como "sem como pontuar").
  if (
    palpite.palpite_casa === null ||
    palpite.palpite_fora === null ||
    jogo.placar_casa === null ||
    jogo.placar_fora === null
  ) {
    return { pontos: 0, cravada: false };
  }

  const exato =
    palpite.palpite_casa === jogo.placar_casa &&
    palpite.palpite_fora === jogo.placar_fora;

  const saldoP = palpite.palpite_casa - palpite.palpite_fora;
  const saldoR = jogo.placar_casa - jogo.placar_fora;
  // Empate conta como sign 0; acerta quem acertou vencedor ou empate.
  const resultadoCerto = Math.sign(saldoP) === Math.sign(saldoR);

  let pontos: number;
  if (jogo.classico) {
    pontos = exato
      ? config.pts_cravada_classico
      : resultadoCerto
        ? config.pts_acerto_classico
        : 0;
  } else {
    pontos = exato
      ? config.pts_cravada
      : resultadoCerto
        ? config.pts_acerto
        : 0;
  }

  return { pontos, cravada: exato };
}
