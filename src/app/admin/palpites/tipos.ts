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
