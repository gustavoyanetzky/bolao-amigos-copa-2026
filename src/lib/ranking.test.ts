import { describe, it, expect } from "vitest";
import {
  classificar,
  premiacao,
  type ParticipanteRanking,
  type PalpiteRanking,
} from "./ranking";

// Cenario real do dia 1 (dados-bolao.md): jogo MEX 2x0 RSA apurado.
// Cravada (2 pts): Dyego, Fabricio, Hiago Caetano, Ribeiro.
// Acerto (1 pt): Alisson, Felipe, Felipe Teodoro, Joaninha, Machado, Mec,
//   Ricardo PT. Zero: Adriano, Bruno Zenci, Diego Franqueiro, Gabriel,
//   Nelson, Paulinho. KOR x CZE ainda nao apurado (todos 0 nesse jogo).

const JOGO_MEX = "jogo-mex-rsa";
const JOGO_KOR = "jogo-kor-cze"; // nao encerrado -> 0 pts

interface Caso {
  nome: string;
  pontosMex: number;
  cravadaMex: boolean;
}

const dia1: Caso[] = [
  { nome: "Dyego", pontosMex: 2, cravadaMex: true },
  { nome: "Fabricio", pontosMex: 2, cravadaMex: true },
  { nome: "Hiago Caetano", pontosMex: 2, cravadaMex: true },
  { nome: "Ribeiro", pontosMex: 2, cravadaMex: true },
  { nome: "Alisson", pontosMex: 1, cravadaMex: false },
  { nome: "Felipe", pontosMex: 1, cravadaMex: false },
  { nome: "Felipe Teodoro", pontosMex: 1, cravadaMex: false },
  { nome: "Joaninha", pontosMex: 1, cravadaMex: false },
  { nome: "Machado", pontosMex: 1, cravadaMex: false },
  { nome: "Mec", pontosMex: 1, cravadaMex: false },
  { nome: "Ricardo PT", pontosMex: 1, cravadaMex: false },
  { nome: "Adriano", pontosMex: 0, cravadaMex: false },
  { nome: "Bruno Zenci", pontosMex: 0, cravadaMex: false },
  { nome: "Diego Franqueiro", pontosMex: 0, cravadaMex: false },
  { nome: "Gabriel", pontosMex: 0, cravadaMex: false },
  { nome: "Nelson", pontosMex: 0, cravadaMex: false },
  { nome: "Paulinho", pontosMex: 0, cravadaMex: false },
];

function montarDia1(): {
  participantes: ParticipanteRanking[];
  palpites: PalpiteRanking[];
} {
  const participantes: ParticipanteRanking[] = dia1.map((c) => ({
    id: c.nome,
    nome: c.nome,
    selecao_campea: null,
  }));

  const palpites: PalpiteRanking[] = [];
  for (const c of dia1) {
    // Palpite do MEX x RSA (apurado).
    palpites.push({
      participante_id: c.nome,
      jogo_id: JOGO_MEX,
      pontos: c.pontosMex,
      cravada: c.cravadaMex,
      wo: false,
    });
    // Palpite do KOR x CZE (nao apurado -> 0 pts, sem cravada).
    palpites.push({
      participante_id: c.nome,
      jogo_id: JOGO_KOR,
      pontos: 0,
      cravada: false,
      wo: false,
    });
  }

  return { participantes, palpites };
}

const config = { pts_campeao: 5 };

describe("classificar — cenario dia 1", () => {
  it("coloca os 4 cravadores (2 pts, 1 cravada) na frente", () => {
    const { participantes, palpites } = montarDia1();
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: null,
    });

    // Os 4 primeiros sao os cravadores, com 2 pts e 1 cravada cada.
    const top4 = rank.slice(0, 4);
    for (const linha of top4) {
      expect(linha.total).toBe(2);
      expect(linha.cravadas).toBe(1);
    }
    const nomesTop4 = top4.map((l) => l.nome).sort();
    expect(nomesTop4).toEqual([
      "Dyego",
      "Fabricio",
      "Hiago Caetano",
      "Ribeiro",
    ]);

    // Dyego esta entre os 1º (2 pts, 1 cravada).
    const dyego = rank.find((l) => l.nome === "Dyego")!;
    expect(dyego.posicao).toBeLessThanOrEqual(4);
    expect(dyego.total).toBe(2);
    expect(dyego.cravadas).toBe(1);
  });

  it("desempata os cravadores por nome (mesmo total e cravadas)", () => {
    const { participantes, palpites } = montarDia1();
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: null,
    });
    // Empate total: ordem alfabetica pt-BR -> Dyego(1) Fabricio(2) Hiago(3) Ribeiro(4).
    expect(rank[0].nome).toBe("Dyego");
    expect(rank[1].nome).toBe("Fabricio");
    expect(rank[2].nome).toBe("Hiago Caetano");
    expect(rank[3].nome).toBe("Ribeiro");
  });

  it("posiciona os acertadores (1 pt) logo apos os cravadores", () => {
    const { participantes, palpites } = montarDia1();
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: null,
    });
    // Posicoes 5..11 sao os 7 acertadores com 1 pt e 0 cravadas.
    const faixa = rank.slice(4, 11);
    for (const linha of faixa) {
      expect(linha.total).toBe(1);
      expect(linha.cravadas).toBe(0);
    }
    // Resto (12..17) com 0 pts.
    for (const linha of rank.slice(11)) {
      expect(linha.total).toBe(0);
    }
    expect(rank).toHaveLength(17);
  });
});

describe("classificar — desempate por cravadas", () => {
  it("quem tem mais cravadas fica na frente com mesmo total", () => {
    // A: 1 acerto + 1 acerto = 2 pts, 0 cravadas.
    // B: 1 cravada (2) + ... ajusta p/ mesmo total 2 com 1 cravada.
    const participantes: ParticipanteRanking[] = [
      { id: "A", nome: "Ana", selecao_campea: null },
      { id: "B", nome: "Bia", selecao_campea: null },
    ];
    const palpites: PalpiteRanking[] = [
      { participante_id: "A", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "A", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
      { participante_id: "B", jogo_id: "j1", pontos: 2, cravada: true, wo: false },
      { participante_id: "B", jogo_id: "j2", pontos: 0, cravada: false, wo: false },
    ];
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: null,
    });
    expect(rank[0].nome).toBe("Bia"); // 2 pts, 1 cravada
    expect(rank[0].cravadas).toBe(1);
    expect(rank[1].nome).toBe("Ana"); // 2 pts, 0 cravadas
  });
});

describe("classificar — desempate por WO (menor na frente)", () => {
  it("conta WO so de jogos nao invalidados e ranqueia menor WO na frente", () => {
    // Ambos 2 pts, 0 cravadas. Carlos tem 1 WO valido; Davi tem 0.
    const participantes: ParticipanteRanking[] = [
      { id: "C", nome: "Carlos", selecao_campea: null },
      { id: "D", nome: "Davi", selecao_campea: null },
    ];
    const palpites: PalpiteRanking[] = [
      { participante_id: "C", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "C", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
      // WO valido (jogo nao invalidado) -> conta.
      { participante_id: "C", jogo_id: "j3", pontos: -1, cravada: false, wo: true },
      // WO em jogo invalidado -> NAO conta no desempate, e pontos ja zerados.
      { participante_id: "C", jogo_id: "j-inv", pontos: 0, cravada: false, wo: true },
      { participante_id: "D", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "D", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
    ];
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: new Set(["j-inv"]),
      config,
      campeaoReal: null,
    });
    // Carlos total = 1+1-1+0 = 1; Davi total = 2. Davi vence por total mesmo.
    // Ajuste: igualar totais p/ isolar o desempate de WO seria preciso outro
    // setup. Aqui validamos a CONTAGEM de WO independente do total.
    const carlos = rank.find((l) => l.nome === "Carlos")!;
    const davi = rank.find((l) => l.nome === "Davi")!;
    expect(carlos.wo).toBe(1); // so o WO valido conta
    expect(davi.wo).toBe(0);
  });

  it("com totais iguais, menor WO assume a frente", () => {
    // Eva: 2 pts (2 acertos), 0 WO. Fred: 2 pts (1 cravada) mas 1 WO -1...
    // p/ igualar total: Fred = cravada(2) + acerto(1) - WO(1) = 2; 1 cravada.
    // Entao Fred ganharia por cravadas. Construir empate REAL de total+cravadas:
    // Gil: acerto(1)+acerto(1) = 2, 0 cravadas, 0 WO.
    // Hugo: acerto(1)+acerto(1)+acerto(1)-WO(1)=2, 0 cravadas, 1 WO.
    const participantes: ParticipanteRanking[] = [
      { id: "G", nome: "Gil", selecao_campea: null },
      { id: "H", nome: "Hugo", selecao_campea: null },
    ];
    const palpites: PalpiteRanking[] = [
      { participante_id: "G", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "G", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
      { participante_id: "H", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "H", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
      { participante_id: "H", jogo_id: "j3", pontos: 1, cravada: false, wo: false },
      { participante_id: "H", jogo_id: "j4", pontos: -1, cravada: false, wo: true },
    ];
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: null,
    });
    // Ambos total 2, 0 cravadas. Gil tem 0 WO, Hugo tem 1 WO -> Gil na frente.
    expect(rank[0].nome).toBe("Gil");
    expect(rank[0].wo).toBe(0);
    expect(rank[1].nome).toBe("Hugo");
    expect(rank[1].wo).toBe(1);
  });
});

describe("classificar — bonus e desempate por campeao", () => {
  it("aplica +pts_campeao a quem acertou o campeao real", () => {
    const participantes: ParticipanteRanking[] = [
      { id: "X", nome: "Xuxa", selecao_campea: "BRA" },
      { id: "Y", nome: "Yara", selecao_campea: "ARG" },
    ];
    const palpites: PalpiteRanking[] = [
      { participante_id: "X", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "Y", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
    ];
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: "BRA",
    });
    const xuxa = rank.find((l) => l.nome === "Xuxa")!;
    const yara = rank.find((l) => l.nome === "Yara")!;
    expect(xuxa.acertouCampeao).toBe(true);
    expect(xuxa.total).toBe(1 + 5); // bonus campeao
    expect(yara.acertouCampeao).toBe(false);
    expect(yara.total).toBe(1);
    expect(rank[0].nome).toBe("Xuxa");
  });

  it("desempata por acertouCampeao quando total/cravadas/wo empatam", () => {
    // Empate de total exige somar o bonus dos dois lados de formas diferentes:
    // Ivo: acerto+acerto+acerto+acerto+acerto+acerto = 6 pts, sem campeao.
    // Joel: 1 acerto (1) + campeao (5) = 6 pts, com campeao. Ambos 0 cravadas, 0 WO.
    const participantes: ParticipanteRanking[] = [
      { id: "I", nome: "Ivo", selecao_campea: "MEX" },
      { id: "J", nome: "Joel", selecao_campea: "BRA" },
    ];
    const palpites: PalpiteRanking[] = [
      { participante_id: "I", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
      { participante_id: "I", jogo_id: "j2", pontos: 1, cravada: false, wo: false },
      { participante_id: "I", jogo_id: "j3", pontos: 1, cravada: false, wo: false },
      { participante_id: "I", jogo_id: "j4", pontos: 1, cravada: false, wo: false },
      { participante_id: "I", jogo_id: "j5", pontos: 1, cravada: false, wo: false },
      { participante_id: "I", jogo_id: "j6", pontos: 1, cravada: false, wo: false },
      { participante_id: "J", jogo_id: "j1", pontos: 1, cravada: false, wo: false },
    ];
    const rank = classificar({
      participantes,
      palpites,
      jogosInvalidadosIds: [],
      config,
      campeaoReal: "BRA",
    });
    // Ambos total 6, 0 cravadas, 0 WO. Joel acertou campeao -> Joel na frente.
    expect(rank[0].total).toBe(6);
    expect(rank[1].total).toBe(6);
    expect(rank[0].nome).toBe("Joel");
    expect(rank[0].acertouCampeao).toBe(true);
    expect(rank[1].nome).toBe("Ivo");
    expect(rank[1].acertouCampeao).toBe(false);
  });
});

describe("premiacao", () => {
  it("sem valorCota: retorna so percentuais (arrecadado/premios null)", () => {
    const r = premiacao({
      pagosCount: 17,
      valorCota: null,
      pct1: 60,
      pct2: 30,
      pct3: 10,
    });
    expect(r.percentuais).toEqual([60, 30, 10]);
    expect(r.arrecadado).toBeNull();
    expect(r.premios).toBeNull();
  });

  it("com valorCota: calcula arrecadado e premios pelos percentuais", () => {
    const r = premiacao({
      pagosCount: 17,
      valorCota: 50,
      pct1: 60,
      pct2: 30,
      pct3: 10,
    });
    expect(r.arrecadado).toBe(850); // 17 * 50
    expect(r.premios).toEqual([510, 255, 85]); // 60/30/10 de 850
    expect(r.percentuais).toEqual([60, 30, 10]);
  });

  it("com 0 pagos e valorCota: arrecadado e premios zerados", () => {
    const r = premiacao({
      pagosCount: 0,
      valorCota: 50,
      pct1: 60,
      pct2: 30,
      pct3: 10,
    });
    expect(r.arrecadado).toBe(0);
    expect(r.premios).toEqual([0, 0, 0]);
  });
});
