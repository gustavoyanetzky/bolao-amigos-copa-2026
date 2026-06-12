// Bandeira — renderiza a bandeira da selecao via flagcdn (SVG remoto).
// Usa <img> simples de proposito (next/image nao lida bem com SVG remoto).
// Apresentacional puro.

interface BandeiraProps {
  /** Codigo iso2 da bandeira no flagcdn (ex: "br", "mx", "gb-sct"). */
  iso2: string | null;
  /** Nome da selecao (usado no alt). */
  nome: string;
  /** Largura em px. Default: 20. */
  width?: number;
  /** Altura em px. Default: igual a width * 0.75 (proporcao ~4:3 do flagcdn). */
  height?: number;
  /** Classes extras. */
  className?: string;
}

export default function Bandeira({
  iso2,
  nome,
  width = 20,
  height,
  className,
}: BandeiraProps) {
  const h = height ?? Math.round(width * 0.75);

  // Sem iso2: placeholder neutro (quadradinho) para nao quebrar layout.
  if (!iso2) {
    return (
      <span
        role="img"
        aria-label={nome}
        title={nome}
        className={`inline-block rounded-sm bg-surface-variant border border-border ${className ?? ""}`.trim()}
        style={{ width: `${width}px`, height: `${h}px` }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${iso2}.svg`}
      alt={nome}
      title={nome}
      width={width}
      height={h}
      loading="lazy"
      className={`inline-block rounded-sm object-cover shadow-sm ${className ?? ""}`.trim()}
      style={{ width: `${width}px`, height: `${h}px` }}
    />
  );
}
