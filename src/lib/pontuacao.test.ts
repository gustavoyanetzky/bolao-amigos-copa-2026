// Testes da funcao pura de pontuacao (secao 2.1 da spec).
import { describe, it, expect } from "vitest";
import { pontosDoPalpite } from "./pontuacao";

// Config padrao da spec (secao 1, tabela config).
const config = {
  pts_acerto: 1,
  pts_cravada: 2,
  pts_acerto_classico: 3,
  pts_cravada_classico: 4,
  pts_wo: -1,
};

// Helpers para montar palpite/jogo/rodada com defaults sensatos.
function palpite(over: Partial<Parameters<typeof pontosDoPalpite>[0]> = {}) {
  return { palpite_casa: 0, palpite_fora: 0, wo: false, ...over };
}
function jogo(over: Partial<Parameters<typeof pontosDoPalpite>[1]> = {}) {
  return {
    classico: false,
    invalidado: false,
    encerrado: true,
    placar_casa: 0,
    placar_fora: 0,
    ...over,
  };
}
const rodadaOk = { invalidada: false };
const rodadaInvalida = { invalidada: true };

describe("pontosDoPalpite", () => {
  it("jogo invalidado -> 0 pontos, sem cravada", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ invalidado: true, placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 0, cravada: false });
  });

  it("rodada invalidada -> 0 pontos, sem cravada", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ placar_casa: 2, placar_fora: 1 }),
      rodadaInvalida,
      config,
    );
    expect(r).toEqual({ pontos: 0, cravada: false });
  });

  it("WO -> pts_wo (-1), sem cravada", () => {
    const r = pontosDoPalpite(
      palpite({ wo: true, palpite_casa: null, palpite_fora: null }),
      jogo({ placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: -1, cravada: false });
  });

  it("jogo pendente (nao encerrado) -> 0 pontos, sem cravada", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ encerrado: false, placar_casa: null, placar_fora: null }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 0, cravada: false });
  });

  it("cravada normal -> pts_cravada (2), cravada true", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 2, cravada: true });
  });

  it("acerto normal (resultado certo, placar diferente) -> pts_acerto (1)", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 3, palpite_fora: 1 }),
      jogo({ placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 1, cravada: false });
  });

  it("erro (resultado errado) -> 0 pontos, sem cravada", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ placar_casa: 1, placar_fora: 2 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 0, cravada: false });
  });

  it("empate acerto (palpitou empate, deu empate placar diferente) -> pts_acerto (1)", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 1, palpite_fora: 1 }),
      jogo({ placar_casa: 2, placar_fora: 2 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 1, cravada: false });
  });

  it("cravada classico -> pts_cravada_classico (4), cravada true", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 2, palpite_fora: 1 }),
      jogo({ classico: true, placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 4, cravada: true });
  });

  it("acerto classico (resultado certo, placar diferente) -> pts_acerto_classico (3)", () => {
    const r = pontosDoPalpite(
      palpite({ palpite_casa: 3, palpite_fora: 1 }),
      jogo({ classico: true, placar_casa: 2, placar_fora: 1 }),
      rodadaOk,
      config,
    );
    expect(r).toEqual({ pontos: 3, cravada: false });
  });
});
