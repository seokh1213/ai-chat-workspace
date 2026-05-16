import { Moon, Sun } from "lucide-react";

import { useColorTheme } from "../../lib/useColorTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useColorTheme();
  const isDark = theme === "dark";

  return (
    <button
      className="icon-button theme-toggle"
      type="button"
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={isDark}
      onClick={toggleTheme}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
