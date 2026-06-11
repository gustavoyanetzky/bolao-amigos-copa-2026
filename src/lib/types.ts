// Tipos do dominio do Bolao. Espelham o schema em supabase/migrations.
// Quando houver projeto Supabase conectado, podem ser regenerados via
// `supabase gen types typescript`.

export type Fase = "grupos" | "oitavas" | "quartas" | "semi" | "final";

export interface Selecao {
  codigo: string; // codigo FIFA, ex "BRA"
  nome: string;
  iso2: string | null; // p/ bandeira flagcdn, ex "br"
  emoji: string | null;
}

export interface Participante {
  id: string;
  nome: string;
  contato: string | null; // PRIVADO — nunca no publico
  pago: boolean; // PRIVADO
  pago_em: string | null; // PRIVADO
  selecao_campea: string | null; // codigo da selecao campea
  campea_em: string | null;
  created_at: string;
}

// Projecao publica de participante (view participantes_publico).
export interface ParticipantePublico {
  id: string;
  nome: string;
  selecao_campea: string | null;
}

export interface Rodada {
  id: string;
  nome: string;
  ordem: number;
  prazo_palpite: string | null; // so referencia visual
  invalidada: boolean;
  created_at: string;
}

export interface Jogo {
  id: string;
  rodada_id: string;
  fase: Fase | null;
  grupo: string | null;
  time_casa_cod: string;
  time_fora_cod: string;
  classico: boolean;
  invalidado: boolean;
  data_hora: string;
  placar_casa: number | null;
  placar_fora: number | null;
  encerrado: boolean;
  created_at: string;
}

export interface Palpite {
  id: string;
  participante_id: string;
  jogo_id: string;
  palpite_casa: number | null; // null se WO
  palpite_fora: number | null; // null se WO
  wo: boolean;
  pontos: number; // cache do calculo (so deste jogo)
  cravada: boolean; // cache: placar exato?
  created_at: string;
}

export interface Config {
  id: number; // sempre 1 (singleton)
  pts_acerto: number;
  pts_cravada: number;
  pts_acerto_classico: number;
  pts_cravada_classico: number;
  pts_campeao: number;
  pts_wo: number;
  pct_1: number;
  pct_2: number;
  pct_3: number;
  valor_cota: number | null;
  prazo_campeao: string;
  campeao_real: string | null;
}
