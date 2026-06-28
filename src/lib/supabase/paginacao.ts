import "server-only";

/**
 * Teto de linhas por request do PostgREST (db-max-rows). Leituras que podem
 * passar disso (ex: TODOS os palpites do bolao) precisam paginar — senao o
 * Supabase devolve so as primeiras 1000 linhas silenciosamente.
 */
const TAMANHO_PAGINA = 1000;

/**
 * Busca TODAS as linhas de uma query paginando por `range` [from,to]
 * (inclusivos) ate esgotar. Passe sempre uma ordenacao estavel na query
 * (ex: .order("id")) para a paginacao nao repetir/pular linhas.
 */
export async function buscarTodos<T>(
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null }>,
): Promise<T[]> {
  const linhas: T[] = [];
  for (let from = 0; ; from += TAMANHO_PAGINA) {
    const { data } = await range(from, from + TAMANHO_PAGINA - 1);
    if (!data || data.length === 0) break;
    linhas.push(...data);
    if (data.length < TAMANHO_PAGINA) break;
  }
  return linhas;
}
