import {auth} from "@/src/auth";
import {prisma} from "@/src/server/prisma";

export async function getViewer() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    include: {
      memberships: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {permission: true},
              },
            },
          },
          municipality: true,
          school: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const municipalityId = user.memberships[0]?.municipalityId ?? null;

  return {
    session,
    user,
    municipalityId,
  };
}

export async function resolvePreferredLocale(userId: string) {
  const user = await prisma.user.findUnique({
    where: {id: userId},
    select: {localeOverride: true, memberships: {select: {municipality: {select: {defaultLocale: true}}}, take: 1}},
  });

  return user?.localeOverride ?? user?.memberships[0]?.municipality.defaultLocale ?? "nb";
}
