import {TRPCError} from "@trpc/server";
import {z} from "zod";
import {assertPermission} from "@/src/server/auth/rbac";
import {getSchoolOverview} from "@/src/server/domain/overview";
import {protectedProcedure, router} from "@/src/server/trpc/trpc";

export const schoolRouter = router({
  listSchoolsForUser: protectedProcedure.query(async ({ctx}) => {
    const memberships = await ctx.prisma.membership.findMany({
      where: {
        userId: ctx.userId,
        municipalityId: ctx.municipalityId,
      },
      include: {
        school: true,
      },
    });

    const schools = memberships
      .map((membership) => membership.school)
      .filter((school): school is NonNullable<typeof school> => Boolean(school));

    if (schools.length > 0) {
      return schools;
    }

    return ctx.prisma.school.findMany({
      where: {municipalityId: ctx.municipalityId},
      orderBy: {name: "asc"},
    });
  }),

  overview: protectedProcedure
    .input(
      z.object({
        schoolId: z.string().min(1),
        yearId: z.string().min(1),
        includeDraft: z.boolean().default(true),
      }),
    )
    .query(async ({ctx, input}) => {
      await assertPermission({
        userId: ctx.userId,
        municipalityId: ctx.municipalityId,
        permissionCode: "ALLOCATION.READ",
        schoolId: input.schoolId,
      });

      const school = await ctx.prisma.school.findFirst({
        where: {
          id: input.schoolId,
          municipalityId: ctx.municipalityId,
        },
      });
      if (!school) {
        throw new TRPCError({code: "NOT_FOUND", message: "School not found"});
      }

      const year = await ctx.prisma.academicYear.findFirst({
        where: {id: input.yearId, municipalityId: ctx.municipalityId},
      });
      if (!year) {
        throw new TRPCError({code: "NOT_FOUND", message: "Academic year not found"});
      }

      const overview = await getSchoolOverview({
        schoolId: input.schoolId,
        academicYearId: input.yearId,
        includeDraft: input.includeDraft,
      });

      return {
        school,
        year,
        ...overview,
      };
    }),
});
