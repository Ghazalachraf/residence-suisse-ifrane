'use client';

import { useFormStatus } from 'react-dom';

/** Select qui enregistre automatiquement le formulaire parent dès qu'on change la valeur. */
export function AutoSelect({ name, options, defaultValue, label }: { name: string; options: string[]; defaultValue: string; label: string }) {
  return (
    <select
      name={name}
      aria-label={label}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-md border border-pierre bg-white px-2 py-1 text-[13px]"
    >
      {(options.includes(defaultValue) || !defaultValue ? options : [defaultValue, ...options]).map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

export function SubmitButton({ children, className = 'btn' }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? 'Enregistrement…' : children}
    </button>
  );
}
