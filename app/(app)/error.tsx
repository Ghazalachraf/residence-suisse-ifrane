'use client';

export default function Erreur({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel mx-auto max-w-xl p-6">
      <h1 className="text-[28px]">La base de données ne répond pas</h1>
      <p className="mt-3 text-[15px] leading-relaxed text-granit">{error.message}</p>
      <p className="mt-3 text-[14px] text-granit">
        Vérifie que le compte de service a bien accès au dossier Google Drive, puis réessaie.
      </p>
      <button onClick={reset} className="btn mt-5">Réessayer</button>
    </div>
  );
}
