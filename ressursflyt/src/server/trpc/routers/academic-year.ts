import {AcademicYearStatus} from "@prisma/client";
import {TRPCError} from "@trpc/server";
import {z} from "zod";
import {createAcademicYearFromTemplate} from "@/src/server/domain/academic-year";
import {permissionProcedure, router} from "@/src/server/trpc/trpc";

export const academicYearRouter = router({
  list: permissionProcedure("ACADEMICYEAR.READ").query(async ({ctx}) => {
    return ctx.prisma.academicYear.findMany({
      where: {municipalityId: ctx.municipalityId},
      orderBy: {startDate: "desc"},
    });
  }),

  createFromTemplate: permissionProcedure("ACADEMICYEAR.CREATE")
    .input(
      z.object({
        templateYearId: z.string().min(1),
        name: z.string().min(3),
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      if (input.startDate >= input.endDate) {
        throw new TRPCError({code: "BAD_REQUEST", message: "startDate must be before endDate"});
      }

      return createAcademicYearFromTemplate({
        municipalityId: ctx.municipalityId,
        templateYearId: input.templateYearId,
        newYear: {
          name: input.name,
          startDate: input.startDate,
          endDate: input.endDate,
        },
      });
    }),

  lock: permissionProcedure("ACADEMICYEAR.LOCK")
    .input(z.object({academicYearId: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      return ctx.prisma.academicYear.update({
        where: {id: input.academicYearId, municipalityId: ctx.municipalityId},
        data: {
          status: AcademicYearStatus.LOCKED,
          lockedAt: new Date(),
        },
      });
    }),

  unlock: permissionProcedure("ACADEMICYEAR.UNLOCK")
    .input(z.object({academicYearId: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
      const settings = await ctx.prisma.municipalitySettings.findUnique({
        where: {municipalityId: ctx.municipalityId},
      });

      if (!settings?.allowYearUnlock) {
        throw new TRPCError({code: "FORBIDDEN", message: "Unlock is disabled by municipality settings"});
      }

      return ctx.prisma.academicYear.update({
        where: {id: input.academicYearId, municipalityId: ctx.municipalityId},
        data: {
          status: AcademicYearStatus.ACTIVE,
          lockedAt: null,
        },
      });
    }),
});
