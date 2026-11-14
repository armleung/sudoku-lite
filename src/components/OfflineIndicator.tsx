import {useEffect, useState} from "react";

export function OfflineIndicator() {
  const [offline, setOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      data-testid="offline-indicator"
      role="status"
      className="bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-white"
    >
      Offline — playing from the cached version
    </div>
  );
}
