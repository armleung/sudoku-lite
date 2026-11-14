import {useEffect, useState} from "react";

const DISMISSED_KEY = "sudoku_lite_v1_install_hint_dismissed";

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as {standalone?: boolean}).standalone === true
  );
}

/**
 * iOS has no programmatic install prompt (SPEC §6.16): this card walks the
 * user through Share → Add to Home Screen. Shown once per browser session on
 * iOS while running in a normal tab; it disappears as soon as the app is
 * launched from the home screen.
 */
export function InstallHint() {
  const [visible, setVisible] = useState(() => isIOS() && !isStandalone() && !sessionStorage.getItem(DISMISSED_KEY));

  // Hide the moment the app becomes standalone (user installed it).
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const check = () => {
      if (media.matches) setVisible(false);
    };
    media.addEventListener("change", check);
    return () => media.removeEventListener("change", check);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // Ignore storage failures; the hint simply stays until reload.
    }
    setVisible(false);
  };

  return (
    <div
      data-testid="install-hint"
      role="note"
      className="flex items-start gap-3 rounded-lg bg-teal-600 p-3 text-sm text-white shadow-md"
    >
      <div className="flex-1">
        <p className="font-semibold">Install Sudoku Lite on your iPhone</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4 text-teal-50">
          <li>
            Open this page in <strong>Safari</strong>
          </li>
          <li>
            Tap the <strong>Share</strong> button in the toolbar
          </li>
          <li>
            Scroll down and tap <strong>Add to Home Screen</strong>
          </li>
          <li>
            Tap <strong>Add</strong> — done, it works offline
          </li>
        </ol>
      </div>
      <button
        type="button"
        aria-label="Dismiss install instructions"
        data-testid="install-hint-dismiss"
        onClick={dismiss}
        className="rounded p-1 text-teal-100 hover:bg-teal-500"
      >
        ✕
      </button>
    </div>
  );
}
