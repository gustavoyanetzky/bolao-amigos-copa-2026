// Tipos compartilhados entre o Server Component (page) e os client
// components da feature de palpites. Apenas dados serializaveis.

/** Opcao de jogo no seletor (modo "Por jogo"). */
export interface JogoOpcao {
  id: string;
  casaCod: string;
  foraCod: string;
  casaNome: string;
  foraNome: string;
  rodadaNome: string;
  encerrado: boolean;
}

/** Linha do grid: participante + palpite existente (se houver). */
export interface LinhaPalpite {
  participanteId: string;
  nome: string;
  palpiteCasa: number | null;
  palpiteFora: number | null;
  wo: boolean;
  /** true se ja existe registro (palpite ou WO) para este participante/jogo. */
  temRegistro: boolean;
  /** Cache de pontos deste jogo (so informativo quando encerrado). */
  pontos: number;
  cravada: boolean;
}

/** Opcao de palpiteiro no seletor (modo "Por palpiteiro"). */
export interface PalpiteiroOpcao {
  id: string;
  nome: string;
}

/** Lado de um jogo ja resolvido p/ render (selecao ou rotulo de vaga). */
export interface LadoJogo {
  codigo: string | null;
  nome: string | null;
  iso2: string | null;
  rotulo: string | null;
}

/**
 * Linha do grid no modo "Por palpiteiro": um JOGO da rodada + o palpite do
 * palpiteiro fixo para esse jogo (se houver).
 */
export interface LinhaJogoPalpite {
  jogoId: string;
  casa: LadoJogo;
  fora: LadoJogo;
  hora: string;
  encerrado: boolean;
  palpiteCasa: number | null;
  palpiteFora: number | null;
  wo: boolean;
  /** true se ja existe registro (palpite ou WO) p/ este palpiteiro/jogo. */
  temRegistro: boolean;
  pontos: number;
  cravada: boolean;
}
