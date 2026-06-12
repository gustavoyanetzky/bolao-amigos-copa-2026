// Badge — selo semantico para marcar estado de um jogo/palpite.
// Variantes: classico (indigo), invalidado (cinza riscado), wo (vermelho).
// Apresentacional puro.

type BadgeVariante = "classico" | "invalidado" | "wo";

interface BadgeProps {
  variante: BadgeVariante;
  /** Rotulo opcional. Default por variante. */
  children?: React.ReactNode;
  className?: string;
}

interface EstiloBadge {
  classes: string;
  rotulo: string;
}

const ESTILOS: Record<BadgeVariante, EstiloBadge> = {
  classico: {
    classes:
      "bg-primary-container text-on-primary-container border border-primary/30",
    rotulo: "Clássico",
  },
  invalidado: {
    classes:
      "bg-surface-variant text-disabled border border-outline-variant line-through",
    rotulo: "Invalidado",
  },
  wo: {
    classes: "bg-error-red/15 text-error-red border border-error-red/40",
    rotulo: "WO",
  },
};

export default function Badge({ variante, children, className }: BadgeProps) {
  const estilo = ESTILOS[variante];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${estilo.classes} ${className ?? ""}`.trim()}
    >
      {children ?? estilo.rotulo}
    </span>
  );
}
