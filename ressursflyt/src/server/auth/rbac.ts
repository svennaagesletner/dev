import {TRPCError} from "@trpc/server";
import {prisma} from "@/src/server/prisma";

export async function getEffectivePermissionCodes(userId: string, municipalityId: string, schoolId?: string | null) {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      municipalityId,
      OR: schoolId ? [{ schoolId: null }, { schoolId }] : [{ schoolId: null }, { schoolId: { not: null } }],
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  return new Set(
    memberships.flatMap((membership) => membership.role.rolePermissions.map((rp) => rp.permission.code)),
  );
}

export async function assertPermission(params: {
  userId: string;
  municipalityId: string;
  permissionCode: string;
  schoolId?: string | null;
}) {
  const effectiveCodes = await getEffectivePermissionCodes(params.userId, params.municipalityId, params.schoolId);
  if (!effectiveCodes.has(params.permissionCode)) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Missing permission: ${params.permissionCode}` });
  }
}
