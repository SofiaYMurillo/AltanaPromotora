import { createHash, randomBytes } from "node:crypto";

import {
  getGoogleClientId,
  getGoogleClientSecret,
  getGoogleRedirectUri,
} from "../config/google-oauth-config";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleOAuthStart = {
  authorizationUrl: string;
  state: string;
  codeVerifier: string;
};

export type GoogleIdentity = {
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
};

function base64Url(buffer: Buffer) {
  return buffer.toString("base64url");
}

export function createGoogleOAuthStart(): GoogleOAuthStart {
  const state = base64Url(randomBytes(24));
  const codeVerifier = base64Url(randomBytes(32));
  const codeChallenge = base64Url(
    createHash("sha256").update(codeVerifier).digest(),
  );

  const params = new URLSearchParams({
    client_id: getGoogleClientId(),
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });

  return {
    authorizationUrl: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    state,
    codeVerifier,
  };
}

export async function exchangeGoogleAuthorizationCode(input: {
  code: string;
  codeVerifier: string;
}): Promise<GoogleIdentity | null> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: input.code,
    client_id: getGoogleClientId(),
    client_secret: getGoogleClientSecret(),
    redirect_uri: getGoogleRedirectUri(),
    code_verifier: input.codeVerifier,
  });

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
  };

  if (!tokenPayload.access_token) {
    return null;
  }

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });

  if (!profileResponse.ok) {
    return null;
  }

  const profile = (await profileResponse.json()) as {
    email?: string;
    email_verified?: boolean;
    given_name?: string;
    family_name?: string;
  };

  const email = profile.email?.trim();
  if (!email) {
    return null;
  }

  return {
    email,
    emailVerified: profile.email_verified === true,
    firstName: profile.given_name?.trim() || undefined,
    lastName: profile.family_name?.trim() || undefined,
  };
}
