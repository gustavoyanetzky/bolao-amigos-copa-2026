"use client";

// PublicBottomNav — navegacao inferior fixa das telas publicas.
// 3 abas: Classificacao (/), Resultados (/resultados), Grade (/grade).
// Aba ativa destacada via usePathname.

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

interface Aba {
  href: string;
  label: string;
  icon: string;
}

const ABAS: Aba[] = [
  { href: "/", label: "Classificação", icon: "leaderboard" },
  { href: "/resultados", label: "Resultados", icon: "sports_soccer" },
  { href: "/grade", label: "Grade", icon: "grid_view" },
];

export default function PublicBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md z-50 h-16 border-t border-border flex justify-around items-center px-2">
      {ABAS.map((aba) => {
        // Classificacao so ativa em "/"; demais por prefixo.
        const ativa =
          aba.href === "/"
            ? pathname === "/"
            : pathname.startsWith(aba.href);

        return (
          <Link
            key={aba.href}
            href={aba.href}
            aria-current={ativa ? "page" : undefined}
            className={`flex flex-col items-center justify-center transition-transform active:scale-90 ${
              ativa
                ? "bg-primary-container text-on-primary-container rounded-full px-4 py-1"
                : "text-text-secondary hover:text-primary px-4 py-1"
            }`}
          >
            <Icon name={aba.icon} fill={ativa} size={24} />
            <span className="text-label-sm font-label-sm mt-0.5">
              {aba.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
