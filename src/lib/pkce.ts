function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function generatePkce(): Promise<{
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}> {
  const verifierBytes = crypto.getRandomValues(new Uint8Array(32));
  const codeVerifier = base64urlEncode(verifierBytes.buffer);

  const challengeBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(codeVerifier)
  );
  const codeChallenge = base64urlEncode(challengeBytes);

  const stateBytes = crypto.getRandomValues(new Uint8Array(16));
  const state = Array.from(stateBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return { codeVerifier, codeChallenge, state };
}

export function buildAuthUrl(
  clientId: string,
  codeChallenge: string,
  state: string,
  redirectUri: string
): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user repo read:org",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}
