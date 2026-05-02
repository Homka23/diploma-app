export default function Loader({ fullScreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-5">
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
        <svg className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
        </svg>
      </div>

      {/* Equalizer bars */}
      <div className="flex items-end gap-[5px] h-8">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-[5px] rounded-full bg-primary animate-eq"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f7f7]">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}
