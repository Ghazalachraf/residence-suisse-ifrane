/** Jeton de session dérivé du mot de passe : compatible Edge (middleware) et Node. */
export async function sessionToken(): Promise<string> {
  const data = new TextEncoder().encode(`${process.env.APP_PASSWORD}:${process.env.AUTH_SECRET ?? 'rs'}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
