import Mountains from '@/components/Mountains';
import { login } from '@/lib/actions';
import { saison } from '@/lib/utils';

export default function Login({ searchParams }: { searchParams: { erreur?: string } }) {
  const s = saison();
  return (
    <div style={{ ['--saison' as string]: s.accent }} className="flex min-h-screen flex-col bg-sapin">
      <div className="flex flex-1 items-center justify-center px-5">
        <form action={login} className="w-full max-w-sm rounded-[10px] bg-neige p-7">
          <h1 className="text-[32px] leading-tight">Résidence Suisse</h1>
          <p className="mt-1 text-[14px] text-granit">Back office commercial, Ifrane</p>
          <label className="mt-6 block">
            <span className="label">Mot de passe</span>
            <input type="password" name="password" className="field" autoFocus required autoComplete="current-password" />
          </label>
          {searchParams.erreur && <p role="alert" className="mt-2 text-[13px] text-[#7A2424]">Mot de passe incorrect.</p>}
          <button className="btn mt-5 w-full">Se connecter</button>
        </form>
      </div>
      <Mountains s={s} className="h-[140px] w-full" />
    </div>
  );
}
