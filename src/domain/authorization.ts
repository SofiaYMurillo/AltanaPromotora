/**
 * Pure permission evaluation — no persistence imports.
 * Principal admin is treated as fully authorized for internal modules.
 */

export function userCan(
  input: {
    isPrincipalAdmin: boolean;
    permissionNames: string[];
  },
  permission: string,
) {
  if (input.isPrincipalAdmin) {
    return true;
  }

  return input.permissionNames.includes(permission);
}

export function userCanAny(
  input: {
    isPrincipalAdmin: boolean;
    permissionNames: string[];
  },
  permissions: string[],
) {
  if (input.isPrincipalAdmin) {
    return true;
  }

  return permissions.some((name) => input.permissionNames.includes(name));
}
