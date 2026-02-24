export type PermissionCatalogItem = {
  code: string;
  resource: string;
  action: string;
  descriptionKey: string;
};

export const PERMISSIONS: PermissionCatalogItem[] = [
  { code: "RBAC.ROLE_READ", resource: "RBAC", action: "ROLE_READ", descriptionKey: "permission.RBAC_ROLE_READ" },
  { code: "RBAC.ROLE_WRITE", resource: "RBAC", action: "ROLE_WRITE", descriptionKey: "permission.RBAC_ROLE_WRITE" },
  { code: "RBAC.PERMISSION_ASSIGN", resource: "RBAC", action: "PERMISSION_ASSIGN", descriptionKey: "permission.RBAC_PERMISSION_ASSIGN" },
  { code: "INVITE.READ", resource: "INVITE", action: "READ", descriptionKey: "permission.INVITE_READ" },
  { code: "INVITE.CREATE", resource: "INVITE", action: "CREATE", descriptionKey: "permission.INVITE_CREATE" },
  { code: "INVITE.REVOKE", resource: "INVITE", action: "REVOKE", descriptionKey: "permission.INVITE_REVOKE" },
  { code: "ACADEMICYEAR.READ", resource: "ACADEMICYEAR", action: "READ", descriptionKey: "permission.ACADEMICYEAR_READ" },
  { code: "ACADEMICYEAR.CREATE", resource: "ACADEMICYEAR", action: "CREATE", descriptionKey: "permission.ACADEMICYEAR_CREATE" },
  { code: "ACADEMICYEAR.LOCK", resource: "ACADEMICYEAR", action: "LOCK", descriptionKey: "permission.ACADEMICYEAR_LOCK" },
  { code: "ACADEMICYEAR.UNLOCK", resource: "ACADEMICYEAR", action: "UNLOCK", descriptionKey: "permission.ACADEMICYEAR_UNLOCK" },
  { code: "CONTRACT.READ", resource: "CONTRACT", action: "READ", descriptionKey: "permission.CONTRACT_READ" },
  { code: "CONTRACT.UPDATE", resource: "CONTRACT", action: "UPDATE", descriptionKey: "permission.CONTRACT_UPDATE" },
  { code: "DEMAND.READ", resource: "DEMAND", action: "READ", descriptionKey: "permission.DEMAND_READ" },
  { code: "DEMAND.UPDATE", resource: "DEMAND", action: "UPDATE", descriptionKey: "permission.DEMAND_UPDATE" },
  { code: "ALLOCATION.READ", resource: "ALLOCATION", action: "READ", descriptionKey: "permission.ALLOCATION_READ" },
  { code: "ALLOCATION.UPDATE", resource: "ALLOCATION", action: "UPDATE", descriptionKey: "permission.ALLOCATION_UPDATE" },
  { code: "SPECIAL.EDIT_WHEN_LOCKED", resource: "SPECIAL", action: "EDIT_WHEN_LOCKED", descriptionKey: "permission.EDIT_WHEN_LOCKED" },
];

export const STARTER_ROLES: Array<{ name: string; description: string; permissionCodes: string[]; isSystemTemplate: boolean }> = [
  {
    name: "Municipality Admin",
    description: "Full municipality administration",
    isSystemTemplate: true,
    permissionCodes: PERMISSIONS.map((p) => p.code),
  },
  {
    name: "School Leader",
    description: "School-level management and updates",
    isSystemTemplate: true,
    permissionCodes: [
      "ACADEMICYEAR.READ",
      "CONTRACT.READ",
      "CONTRACT.UPDATE",
      "DEMAND.READ",
      "DEMAND.UPDATE",
      "ALLOCATION.READ",
      "ALLOCATION.UPDATE",
      "INVITE.READ",
    ],
  },
  {
    name: "Planner",
    description: "Can plan demand and allocations",
    isSystemTemplate: true,
    permissionCodes: ["ACADEMICYEAR.READ", "CONTRACT.READ", "DEMAND.READ", "DEMAND.UPDATE", "ALLOCATION.READ", "ALLOCATION.UPDATE"],
  },
  {
    name: "Read Only",
    description: "Read-only access",
    isSystemTemplate: true,
    permissionCodes: ["ACADEMICYEAR.READ", "CONTRACT.READ", "DEMAND.READ", "ALLOCATION.READ", "INVITE.READ", "RBAC.ROLE_READ"],
  },
];
