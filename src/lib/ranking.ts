// Lib de classificacao/ranking + premiacao do Bolao.
// Funcoes PURAS: sem Supabase, sem React. Recebem dados ja carregados e
// devolvem o ranking ordenado / a premiacao derivada. Toda a logica de
// agregacao vive aqui (fat server) — o client so renderiza o resultado.
//
// Regras (spec.md secoes 2.2, 2.3, 2.4 e 3):
//   total(p)   = soma(palpite.pontos) + bonusCampeao
//   cravadas   = nº de palpites com cravada=true
//   wo         = nº de palpites com wo=true CUJO jogo NAO esta invalidado
//   ordenacao  = total desc, cravadas desc, wo asc, acertouCampeao desc, nome asc

// --- Entradas ---------------------------------------------------------------

// Participante minimo necessario p/ o ranking (sem dados privados).
export interface ParticipanteRanking {
  id: string;
  nome: string;
  selecao_campea: string | null; // codigo FIFA da selecao campea palpitada
}

// Palpite ja apurado (pontos/cravada sao cache calculado no servidor).
export interface PalpiteRanking {
  participante_id: string;
  jogo_id: string;
  pontos: number; // ja inclui WO (-1) e zera invalidados; NAO inclui campeao
  cravada: boolean; // placar exato?
  wo: boolean; // admin marcou ausencia
}

// Config de pontuacao relevante p/ o ranking.
export interface ConfigRanking {
  pts_campeao: number;
}

export interface ClassificarParams {
  participantes: ParticipanteRanking[];
  palpites: PalpiteRanking[];
  // Jogos invalidados (jogo.invalidado OU rodada.invalidada). Aceita Set ou
  // array de ids — normalizado internamente p/ Set.
  jogosInvalidadosIds: Set<string> | string[];
  config: ConfigRanking;
  campeaoReal: string | null; // codigo FIFA do campeao real (null = nao definido)
}

// --- Saida ------------------------------------------------------------------

export interface LinhaRanking {
  id: string;
  nome: string;
  posicao: number; // 1..n
  total: number;
  cravadas: number;
  wo: number;
  acertouCampeao: boolean;
}

// --- Classificacao ----------------------------------------------------------

export function classificar(params: ClassificarParams): LinhaRanking[] {
  const { participantes, palpites, config, campeaoReal } = params;

  // Normaliza jogos invalidados p/ Set (lookup O(1)).
  const invalidados =
    params.jogosInvalidadosIds instanceof Set
      ? params.jogosInvalidadosIds
      : new Set(params.jogosInvalidadosIds);

  // Agrupa palpites por participante (uma passada).
  const porParticipante = new Map<string, PalpiteRanking[]>();
  for (const palpite of palpites) {
    const lista = porParticipante.get(palpite.participante_id);
    if (lista) lista.push(palpite);
    else porParticipante.set(palpite.participante_id, [palpite]);
  }

  const linhas: LinhaRanking[] = participantes.map((p) => {
    const meusPalpites = porParticipante.get(p.id) ?? [];

    // Soma dos pontos dos palpites (ja inclui WO -1 e zera invalidados).
    let somaPalpites = 0;
    let cravadas = 0;
    let wo = 0;
    for (const palpite of meusPalpites) {
      somaPalpites += palpite.pontos;
      if (palpite.cravada) cravadas += 1;
      // WO so conta como desempate se o jogo NAO foi invalidado.
      if (palpite.wo && !invalidados.has(palpite.jogo_id)) wo += 1;
    }

    const acertouCampeao =
      campeaoReal != null && p.selecao_campea === campeaoReal;

    const total = somaPalpites + (acertouCampeao ? config.pts_campeao : 0);

    return {
      id: p.id,
      nome: p.nome,
      posicao: 0, // atribuido apos ordenar
      total,
      cravadas,
      wo,
      acertouCampeao,
    };
  });

  // Ordena: total desc, cravadas desc, wo asc, acertouCampeao desc, nome asc.
  linhas.sort((a, b) => {
    if (a.total !== b.total) return b.total - a.total;
    if (a.cravadas !== b.cravadas) return b.cravadas - a.cravadas;
    if (a.wo !== b.wo) return a.wo - b.wo;
    if (a.acertouCampeao !== b.acertouCampeao) {
      return Number(b.acertouCampeao) - Number(a.acertouCampeao);
    }
    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  // Atribui posicao sequencial (1..n) na ordem ja desempatada.
  linhas.forEach((linha, i) => {
    linha.posicao = i + 1;
  });

  return linhas;
}

// --- Premiacao --------------------------------------------------------------

export interface PremiacaoParams {
  pagosCount: number; // nº de participantes pagos
  valorCota: number | null; // null = mostra so percentuais
  pct1: number;
  pct2: number;
  pct3: number;
}

export interface PremiacaoResultado {
  percentuais: [number, number, number];
  arrecadado: number | null; // null se valorCota null
  premios: [number, number, number] | null; // null se valorCota null
}

export function premiacao(params: PremiacaoParams): PremiacaoResultado {
  const { pagosCount, valorCota, pct1, pct2, pct3 } = params;
  const percentuais: [number, number, number] = [pct1, pct2, pct3];

  // Sem valor de cota: exibe apenas os percentuais.
  if (valorCota == null) {
    return { percentuais, arrecadado: null, premios: null };
  }

  const arrecadado = pagosCount * valorCota;
  const premios: [number, number, number] = [
    (arrecadado * pct1) / 100,
    (arrecadado * pct2) / 100,
    (arrecadado * pct3) / 100,
  ];

  return { percentuais, arrecadado, premios };
}
