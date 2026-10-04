"use client";

import { usePathname } from "next/navigation";

function bare(p: string) {
  return p.length > 1 ? p.replace(/\/$/, "") : p;
}

/** A nav link that marks the section you are in. */
export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = bare(usePathname() ?? "");
  const target = bare(href);
  const current = path === target || path.startsWith(`${target}/`);
  return (
    <a
      href={href}
      aria-current={current ? "page" : undefined}
      className={`relative py-1 transition-colors hover:text-accent ${
        current ? "text-ink after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-[2px] after:rounded-full after:bg-accent" : ""
      }`}
    >
      {children}
    </a>
  );
}
