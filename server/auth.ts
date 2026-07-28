import { ApiError } from "./errors.js";
import {
  getAuthenticatedUser,
  type AuthenticatedUser,
} from "./supabase.js";

function getBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new ApiError(
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid administrator session is required.",
    );
  }

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorizationHeader.trim());
  if (!match?.[1]) {
    throw new ApiError(
      401,
      "AUTHENTICATION_REQUIRED",
      "A valid administrator session is required.",
    );
  }

  return match[1];
}

function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminEmail(email: string | undefined): boolean {
  return Boolean(email && getAdminEmails().has(email.trim().toLowerCase()));
}

export async function requireAuthenticatedUser(
  authorizationHeader: string | undefined,
): Promise<AuthenticatedUser> {
  return getAuthenticatedUser(getBearerToken(authorizationHeader));
}

export async function requireAdminUser(
  authorizationHeader: string | undefined,
): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(authorizationHeader);

  if (!isAdminEmail(user.email)) {
    throw new ApiError(
      403,
      "ADMIN_ACCESS_REQUIRED",
      "This account is not authorized to update restaurant information.",
    );
  }

  return user;
}
