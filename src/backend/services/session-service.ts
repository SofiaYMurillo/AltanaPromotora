import {
  canAccessAdmin,
  getRoleNames,
  isSessionActive,
} from "@/features/auth/access";
import type { InternalAccessDecision } from "@/features/auth/auth.types";
import type { User } from "@/types/user";
import type { Role } from "@/types/role";

import { getPrincipalAdminUserId } from "../config/auth-config";
import * as roleRepository from "../repositories/role-repository";
import * as sessionRepository from "../repositories/session-repository";
import * as userRepository from "../repositories/user-repository";
import { hashSessionToken } from "../security/password";

export type ResolvedAuthContext = {
  access: InternalAccessDecision;
  user: User | null;
  roles: Role[];
  sessionId: string | null;
};

/**
 * Resolve cookie token → persisted session → user → roles → access decision.
 * Reuses canAccessAdmin; authority is the persisted Session, not a static catalog.
 */
export async function resolveAuthFromToken(
  token: string | undefined | null,
): Promise<ResolvedAuthContext> {
  const principalAdminUserId = getPrincipalAdminUserId();

  if (!token) {
    return {
      access: {
        allowed: false,
        reason: "session_missing",
        roleNames: [],
        isPrincipalAdmin: false,
      },
      user: null,
      roles: [],
      sessionId: null,
    };
  }

  const tokenHash = hashSessionToken(token);
  const record = await sessionRepository.findSessionRecordByTokenHash(tokenHash);

  if (!record || record.revokedAt) {
    return {
      access: {
        allowed: false,
        reason: "session_missing",
        roleNames: [],
        isPrincipalAdmin: false,
      },
      user: null,
      roles: [],
      sessionId: null,
    };
  }

  const session = {
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };

  if (!isSessionActive(session)) {
    return {
      access: {
        allowed: false,
        reason: "session_expired",
        roleNames: [],
        isPrincipalAdmin: false,
      },
      user: null,
      roles: [],
      sessionId: session.id,
    };
  }

  const user = await userRepository.findUserById(record.userId);

  if (!user) {
    return {
      access: {
        allowed: false,
        reason: "unauthorized",
        roleNames: [],
        isPrincipalAdmin: false,
      },
      user: null,
      roles: [],
      sessionId: session.id,
    };
  }

  const roles = await roleRepository.getRolesForUser(user.id);
  const access = canAccessAdmin({
    user,
    roles,
    principalAdminUserId,
  });

  return {
    access,
    user,
    roles,
    sessionId: session.id,
  };
}

export function toSafeSessionPayload(context: ResolvedAuthContext) {
  if (!context.user || !context.access.allowed) {
    return {
      authenticated: false as const,
      reason: context.access.reason,
    };
  }

  return {
    authenticated: true as const,
    user: {
      id: context.user.id,
      email: context.user.email,
      firstName: context.user.firstName,
      lastName: context.user.lastName,
      displayName: `${context.user.firstName} ${context.user.lastName}`,
    },
    roleNames: getRoleNames(context.roles),
    isPrincipalAdmin: context.access.isPrincipalAdmin,
  };
}
