"use client";

import Link from "next/link";
import { Star } from "lucide-react";

export function HomeHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-4 pt-14">
      <h1 className="text-[28px] font-extrabold text-white tracking-tight">Home</h1>
      <Link href="/premium" className="btn-gold">
        <Star size={14} className="opacity-90" fill="currentColor" />
        <span>Unlock all stories</span>
      </Link>
    </header>
  );
}
