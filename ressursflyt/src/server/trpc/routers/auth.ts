import {InviteStatus} from "@prisma/client";
import {TRPCError} from "@trpc/server";
import {z} from "zod";
import {hashInviteToken} from "@/src/server/auth/invite";
import {protectedProcedure, publicProcedure, router} from "@/src/server/trpc/trpc";

export const authRouter = router({
  me: protectedProcedure.query(async ({ctx}) => {
    const user = await ctx.prisma.user.findUnique({
      where: {id: ctx.userId},
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
      throw new TRPCError({code: "NOT_FOUND", message: "User not found"});
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      localeOverride: user.localeOverride,
      memberships: user.memberships.map((membership) => ({
        id: membership.id,
        municipalityId: membership.municipalityId,
        municipalityName: membership.municipality.name,
        schoolId: membership.schoolId,
        schoolName: membership.school?.name ?? null,
        roleName: membership.role.name,
        permissions: membership.role.rolePermissions.map((rp) => rp.permission.code),
      })),
    };
  }),

  acceptInvite: protectedProcedure
    .input(z.object({token: z.string().min(16)}))
    .mutation(async ({ctx, input}) => {
      const tokenHash = hashInviteToken(input.token);
      const invite = await ctx.prisma.invite.findFirst({
        where: {
          tokenHash,
          status: InviteStatus.PENDING,
          expiresAt: {gt: new Date()},
        },
      });

      if (!invite) {
        throw new TRPCError({code: "NOT_FOUND", message: "Invite not found or expired"});
      }

      const memberships = await ctx.prisma.membership.findMany({
        where: {userId: ctx.userId},
      });

      const otherMunicipalityMembership = memberships.find(
        (membership) => membership.municipalityId !== invite.municipalityId,
      );
      if (otherMunicipalityMembership) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User already belongs to another municipality",
        });
      }

      const existingMembership = await ctx.prisma.membership.findFirst({
        where: {
          userId: ctx.userId,
          municipalityId: invite.municipalityId,
          schoolId: invite.schoolId,
          roleId: invite.roleId,
        },
      });

      if (!existingMembership) {
        await ctx.prisma.membership.create({
          data: {
            userId: ctx.userId,
            municipalityId: invite.municipalityId,
            schoolId: invite.schoolId,
            roleId: invite.roleId,
          },
        });
      }

      await ctx.prisma.invite.update({
        where: {id: invite.id},
        data: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: new Date(),
          acceptedByUserId: ctx.userId,
        },
      });

      return {ok: true, municipalityId: invite.municipalityId};
    }),

  noAccessState: publicProcedure
    .input(z.object({userId: z.string().min(1)}))
    .query(async ({ctx, input}) => {
      const count = await ctx.prisma.membership.count({where: {userId: input.userId}});
      return {hasMembership: count > 0};
    }),
});
