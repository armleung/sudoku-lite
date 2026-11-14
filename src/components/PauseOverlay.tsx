export function PauseOverlay({onContinue}: {onContinue: () => void}) {
  return (
    <div
      data-testid="pause-overlay"
      className="absolute inset-0 z-30 flex items-center justify-center rounded-lg bg-white/60 dark:bg-black/60"
      onClick={onContinue}
      role="button"
      aria-label="Continue"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onContinue();
      }}
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-500 shadow-lg transition-transform hover:scale-105">
        <div
          className="ml-1 h-0 w-0 border-l-[28px] border-l-white border-t-[18px] border-t-transparent border-b-[18px] border-b-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
