"use client";

import Link from "next/link";

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 pt-14">
      <h1 className="text-[28px] font-bold text-white tracking-tight">Home</h1>
      <Link href="/premium" className="btn-gold">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="opacity-80"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <span>Unlock all stories</span>
      </Link>
    </header>
  );
}
