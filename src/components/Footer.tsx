"use client";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-glass">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌙</span>
            <span className="font-medium">Voice Bedtime Tales</span>
          </div>
          <span className="hidden sm:inline text-secondary">•</span>
          <p className="text-sm text-secondary">
            © {currentYear} All rights reserved
          </p>
        </div>
        <p className="text-xs text-tertiary mt-2">
          Made with ❤️ for parents who want magical bedtime moments
        </p>
      </div>
    </footer>
  );
}
