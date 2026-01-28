"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// SVG Icons as components
const HomeIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    {!filled && <polyline points="9 22 9 12 15 12 15 22" />}
  </svg>
);

const DiscoverIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polygon
      points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
      fill={filled ? "var(--background-primary)" : "none"}
    />
  </svg>
);

const LibraryIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const ProfileIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  activeIcon: React.ReactNode;
}

const TABS: TabItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: <HomeIcon />,
    activeIcon: <HomeIcon filled />,
  },
  {
    id: "discover",
    label: "Discover",
    href: "/discover",
    icon: <DiscoverIcon />,
    activeIcon: <DiscoverIcon filled />,
  },
  {
    id: "library",
    label: "Library",
    href: "/library",
    icon: <LibraryIcon />,
    activeIcon: <LibraryIcon filled />,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: <ProfileIcon />,
    activeIcon: <ProfileIcon filled />,
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  // Hide on story/preview/album/create detail pages
  const hideOnPaths = ["/story/", "/preview/", "/album/", "/premium", "/create"];
  if (hideOnPaths.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const getIsActive = (tab: TabItem) => {
    if (tab.id === "home") {
      return pathname === "/" || pathname === "";
    }
    return pathname.startsWith(tab.href);
  };

  return (
    <nav className="bottom-tab-bar" role="navigation" aria-label="Main navigation">
      {TABS.map((tab) => {
        const isActive = getIsActive(tab);
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className="tab-item"
            aria-current={isActive ? "page" : undefined}
          >
            <div className={`tab-icon ${isActive ? "active" : ""}`}>
              {isActive ? tab.activeIcon : tab.icon}
            </div>
            <span className={`tab-label ${isActive ? "active" : ""}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
