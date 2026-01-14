"use client";

interface TabNavigationProps {
  activeTab: "create" | "library";
  onTabChange: (tab: "create" | "library") => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="flex gap-2 p-1 glass-card-subtle rounded-xl mx-4 mb-4">
      <button
        type="button"
        onClick={() => onTabChange("create")}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          activeTab === "create"
            ? "bg-white shadow-sm"
            : "text-secondary hover:text-foreground"
        }`}
      >
        Create Story
      </button>
      <button
        type="button"
        onClick={() => onTabChange("library")}
        className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          activeTab === "library"
            ? "bg-white shadow-sm"
            : "text-secondary hover:text-foreground"
        }`}
      >
        My Library
      </button>
    </div>
  );
}
