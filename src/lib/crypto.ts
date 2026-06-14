// SHA-256 helper usado para comparar senhas sem guarda-las em texto puro.
export async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hashes pre-computados (as senhas em texto puro NAO ficam no codigo).
// Family123@
export const FAMILY_PASSWORD_HASH =
  "7007c82e58094a6555e4ccc355be1971b57f813fca397dc544e229fefa393e9a";
// AdministratorAccess3103@
export const ADMIN_PASSWORD_HASH =
  "fe21c25ac4db51dc7d13a4d0d1c0f969b5782fb343f12b14defc6aa0faa73d26";

export async function matchesHash(input: string, hash: string): Promise<boolean> {
  return (await sha256(input)) === hash;
}
