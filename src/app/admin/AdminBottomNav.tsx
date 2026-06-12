"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Abas da navegacao inferior do admin (ordem do spec 4.x). */
const ABAS = [
  { href: "/admin", label: "Painel", icon: "dashboard" },
  { href: "/admin/participantes", label: "Pessoas", icon: "group" },
  { href: "/admin/rodadas", label: "Rodadas", icon: "event" },
  { href: "/admin/jogos", label: "Jogos", icon: "sports_soccer" },
  { href: "/admin/palpites", label: "Palpites", icon: "edit_note" },
  { href: "/admin/config", label: "Config", icon: "settings" },
] as const;

/**
 * Bottom nav do admin. Destaca a aba ativa pela rota atual.
 * Client Component apenas para ler o pathname.
 */
export default function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 z-20 h-bottom-nav-height w-full max-w-md -translate-x-1/2 border-t border-border bg-surface">
      <ul className="flex h-full items-center justify-around px-1">
        {ABAS.map((aba) => {
          // /admin so casa exato; demais casam por prefixo.
          const ativo =
            aba.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(aba.href);

          return (
            <li key={aba.href} className="flex-1">
              <Link
                href={aba.href}
                aria-current={ativo ? "page" : undefined}
                className={`mx-auto flex w-full flex-col items-center justify-center gap-0.5 rounded-full py-1.5 transition-colors ${
                  ativo
                    ? "bg-primary-container text-on-primary-container"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px]"
                  aria-hidden="true"
                >
                  {aba.icon}
                </span>
                <span className="text-[10px] font-medium leading-none">
                  {aba.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
