import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2.5 select-none"
      aria-label="Quibble home"
    >
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-accent shadow-glow transition-transform duration-300 group-hover:scale-105">
        <span className="font-mono text-[15px] font-bold leading-none text-white">
          Q
        </span>
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        Quibble
      </span>
    </Link>
  );
}
