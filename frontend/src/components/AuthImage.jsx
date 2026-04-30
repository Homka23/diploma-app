export default function AuthImage() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        src="/images/piano-login.jpg"
        alt="Piano"
        className="h-full w-full object-cover"
      />

      {/* Solid dark overlay — no gradient */}
      <div className="absolute inset-0 bg-dark/45" />

      {/* Bottom-left text */}
      <div className="absolute bottom-12 left-12 z-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-accent">
          Music Theory App
        </p>
        <h2 className="mb-3 text-4xl font-bold leading-tight text-white">
          Learn Piano Smarter
        </h2>
        <p className="max-w-xs text-sm leading-relaxed text-white/70">
          Master music theory and practice with interactive lessons
        </p>
      </div>
    </div>
  );
}
