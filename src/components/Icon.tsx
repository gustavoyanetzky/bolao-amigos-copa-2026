// Icon — wrapper para Material Symbols Outlined.
// Apresentacional puro. Sem estado, sem dados.

interface IconProps {
  /** Nome do icone Material Symbols (ex: "leaderboard", "sports_soccer"). */
  name: string;
  /** Preenchido (FILL 1) quando true. Default: false (outline). */
  fill?: boolean;
  /** Tamanho da fonte em px. Default: 24. */
  size?: number;
  /** Classes extras (cor, etc). */
  className?: string;
}

export default function Icon({
  name,
  fill = false,
  size = 24,
  className,
}: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ""}`.trim()}
      aria-hidden="true"
      style={{
        fontSize: `${size}px`,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}`,
        lineHeight: 1,
      }}
    >
      {name}
    </span>
  );
}
