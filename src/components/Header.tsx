"use client";

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export function Header({ showBack, onBack, title }: HeaderProps) {
  return (
    <header className="header-glass">
      <div className="w-full max-w-lg mx-auto px-4 flex items-center justify-between">
        {showBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-accent font-medium -ml-2 px-2 py-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl">🌙</span>
            <span className="font-semibold text-sm">Voice Bedtime Tales</span>
          </div>
        )}

        {title && (
          <span className="absolute left-1/2 -translate-x-1/2 font-semibold text-sm">
            {title}
          </span>
        )}

        <div className="w-16" />
      </div>
    </header>
  );
}
