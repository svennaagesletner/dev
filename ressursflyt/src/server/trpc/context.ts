import {auth} from "@/src/auth";
import {prisma} from "@/src/server/prisma";

export async function createTRPCContext() {
  const session = await auth();
  const userId = session?.user?.id;
  const memberships = userId
    ? await prisma.membership.findMany({
        where: {userId},
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
      })
    : [];

  const municipalityId = memberships[0]?.municipalityId ?? null;

  return {
    prisma,
    session,
    userId,
    memberships,
    municipalityId,
  };
}

export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;
