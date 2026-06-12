// PublicHeader — cabecalho fixo das telas publicas.
// Escudo + titulo da marca + slot opcional de "atualizado".
// Apresentacional puro (Server Component).

interface PublicHeaderProps {
  /** Texto do slot direito (ex: "Atualizado ha 2 min"). */
  atualizado?: string;
}

export default function PublicHeader({ atualizado }: PublicHeaderProps) {
  return (
    <header className="bg-surface text-primary sticky top-0 z-50 w-full max-w-md mx-auto border-b border-border flex justify-between items-center px-edge-margin h-header-height">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-cream flex items-center justify-center shrink-0 border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/escudo.jpg"
            alt="Escudo do Bolão Amigos FC"
            className="w-full h-full object-cover"
            width={32}
            height={32}
          />
        </div>
        <h1 className="text-headline-md-mobile font-headline-md text-brand-cream truncate">
          Bolão Amigos FC
        </h1>
      </div>
      {atualizado ? (
        <span className="text-label-sm font-label-sm text-text-secondary truncate shrink-0 pl-2">
          {atualizado}
        </span>
      ) : null}
    </header>
  );
}
