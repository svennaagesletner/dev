import {InviteStatus} from "@prisma/client";
import {z} from "zod";
import {createInviteToken, hashInviteToken} from "@/src/server/auth/invite";
import {permissionProcedure, router} from "@/src/server/trpc/trpc";

export const invitesRouter = router({
  list: permissionProcedure("INVITE.READ").query(async ({ctx}) => {
    return ctx.prisma.invite.findMany({
      where: {municipalityId: ctx.municipalityId},
      include: {
        role: true,
        school: true,
        createdByUser: {select: {id: true, name: true, email: true}},
        acceptedByUser: {select: {id: true, name: true, email: true}},
      },
      orderBy: {createdAt: "desc"},
    });
  }),

  create: permissionProcedure("INVITE.CREATE")
    .input(
      z.object({
        roleId: z.string().min(1),
        schoolId: z.string().optional(),
        email: z.string().email().optional(),
        expiresAt: z.coerce.date(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const token = createInviteToken();
      const tokenHash = hashInviteToken(token);

      const invite = await ctx.prisma.invite.create({
        data: {
          municipalityId: ctx.municipalityId,
          schoolId: input.schoolId,
          roleId: input.roleId,
          email: input.email,
          tokenHash,
          expiresAt: input.expiresAt,
          createdByUserId: ctx.userId,
          status: InviteStatus.PENDING,
        },
      });

      return {
        invite,
        token,
      };
    }),

  revoke: permissionProcedure("INVITE.REVOKE")
    .input(z.object({inviteId: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      await ctx.prisma.invite.update({
        where: {id: input.inviteId, municipalityId: ctx.municipalityId},
        data: {status: InviteStatus.REVOKED},
      });

      return {ok: true};
    }),
});
