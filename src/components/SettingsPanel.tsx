import {usePreferences, type DarkMode} from "../state/PreferencesContext";

const checkbox =
  "h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-600 dark:bg-slate-800";

export function SettingsPanel() {
  const {state: prefs, setDarkMode, toggleWrongEntries, toggleConflicts, toggleOccurrences} =
    usePreferences();

  return (
    <section className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        Settings
      </h2>
      <div className="flex flex-col gap-2 text-sm">
        <label className="flex items-center justify-between gap-2">
          <span>Dark mode</span>
          <select
            value={prefs.darkMode}
            onChange={(e) => setDarkMode(e.target.value as DarkMode)}
            data-testid="dark-mode"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span>Highlight wrong entries</span>
          <input
            type="checkbox"
            className={checkbox}
            checked={prefs.showWrongEntries}
            onChange={toggleWrongEntries}
            data-testid="toggle-wrong"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span>Highlight conflicts</span>
          <input
            type="checkbox"
            className={checkbox}
            checked={prefs.showConflicts}
            onChange={toggleConflicts}
            data-testid="toggle-conflicts"
          />
        </label>
        <label className="flex cursor-pointer items-center justify-between gap-2">
          <span>Number occurrences</span>
          <input
            type="checkbox"
            className={checkbox}
            checked={prefs.showOccurrences}
            onChange={toggleOccurrences}
            data-testid="toggle-occurrences"
          />
        </label>
      </div>
    </section>
  );
}
