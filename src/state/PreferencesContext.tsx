import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type DarkMode = "system" | "light" | "dark";

export interface Preferences {
  darkMode: DarkMode;
  showWrongEntries: boolean;
  showConflicts: boolean;
  showOccurrences: boolean;
}

const STORAGE_KEY = "sudoku_lite_v1_prefs";

const DEFAULTS: Preferences = {
  darkMode: "system",
  showWrongEntries: true,
  showConflicts: true,
  showOccurrences: true,
};

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      darkMode:
        parsed.darkMode === "light" || parsed.darkMode === "dark"
          ? parsed.darkMode
          : "system",
      showWrongEntries: parsed.showWrongEntries ?? true,
      showConflicts: parsed.showConflicts ?? true,
      showOccurrences: parsed.showOccurrences ?? true,
    };
  } catch {
    return DEFAULTS;
  }
}

interface PreferencesContextType {
  state: Preferences;
  setDarkMode: (mode: DarkMode) => void;
  toggleWrongEntries: () => void;
  toggleConflicts: () => void;
  toggleOccurrences: () => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({children}: {children: ReactNode}) {
  const [state, setState] = useState<Preferences>(loadPreferences);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Could not save preferences", error);
    }
  }, [state]);

  // Apply the dark class to <html>. "system" follows the OS and keeps
  // tracking it while in that mode.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark =
        state.darkMode === "dark" || (state.darkMode === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
    };
    apply();
    if (state.darkMode === "system") {
      media.addEventListener("change", apply);
      return () => media.removeEventListener("change", apply);
    }
    return undefined;
  }, [state.darkMode]);

  const setDarkMode = useCallback(
    (darkMode: DarkMode) => setState((s) => ({...s, darkMode})),
    [],
  );
  const toggleWrongEntries = useCallback(
    () => setState((s) => ({...s, showWrongEntries: !s.showWrongEntries})),
    [],
  );
  const toggleConflicts = useCallback(
    () => setState((s) => ({...s, showConflicts: !s.showConflicts})),
    [],
  );
  const toggleOccurrences = useCallback(
    () => setState((s) => ({...s, showOccurrences: !s.showOccurrences})),
    [],
  );

  return (
    <PreferencesContext.Provider
      value={{state, setDarkMode, toggleWrongEntries, toggleConflicts, toggleOccurrences}}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
}
