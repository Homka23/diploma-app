// Full-page error — use when the whole section failed to load
export function ErrorScreen({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 animate-fade-in-up">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <svg className="h-7 w-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-dark/70 mb-1 text-center">{message || 'Something went wrong'}</p>
      <p className="text-xs text-dark/35 mb-6 text-center">Please try again or come back later</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-100"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}

// Inline error banner — use inside forms or cards
export function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 animate-fade-in-up">
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
      <p className="text-sm text-red-500">{message}</p>
    </div>
  );
}
