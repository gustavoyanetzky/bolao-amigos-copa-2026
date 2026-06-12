// TabelaDensa — container generico de tabela densa.
// Casca visual (bg-surface, rounded-xl, border, overflow-hidden) com
// header sticky recebido via prop e linhas zebradas no corpo.
// Reutilizavel: classificacao, palpites do jogo, etc.
// Apresentacional puro. Conforme mockups 01 / 04.

interface TabelaDensaProps {
  /** Conteudo do header sticky (linha de titulos das colunas). */
  header: React.ReactNode;
  /** Linhas da tabela (use TabelaDensa.Linha para zebra automatica). */
  children: React.ReactNode;
  className?: string;
}

interface LinhaProps {
  /** Indice da linha (0-based) — define a cor zebra. */
  indice: number;
  children: React.ReactNode;
  className?: string;
}

// Linha zebrada: par -> surface, impar -> zebra.
function Linha({ indice, children, className }: LinhaProps) {
  const fundo = indice % 2 === 0 ? "bg-surface" : "bg-zebra";
  return (
    <div
      className={`${fundo} hover:bg-surface-variant transition-colors duration-150 ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

function TabelaDensa({ header, children, className }: TabelaDensaProps) {
  return (
    <section
      className={`bg-surface rounded-xl border border-border flex flex-col overflow-hidden ${className ?? ""}`.trim()}
    >
      {/* Header sticky */}
      <div className="bg-surface-container-high border-b border-border sticky top-0 z-10">
        {header}
      </div>
      {/* Corpo com divisorias */}
      <div className="flex flex-col w-full divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

TabelaDensa.Linha = Linha;

export default TabelaDensa;
