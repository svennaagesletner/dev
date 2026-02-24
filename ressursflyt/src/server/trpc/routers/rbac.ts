import {z} from "zod";
import {permissionProcedure, router} from "@/src/server/trpc/trpc";

export const rbacRouter = router({
  listRoles: permissionProcedure("RBAC.ROLE_READ").query(async ({ctx}) => {
    return ctx.prisma.role.findMany({
      where: {municipalityId: ctx.municipalityId},
      include: {
        rolePermissions: {
          include: {permission: true},
        },
      },
      orderBy: {name: "asc"},
    });
  }),

  listPermissions: permissionProcedure("RBAC.ROLE_READ").query(async ({ctx}) => {
    return ctx.prisma.permission.findMany({
      where: {municipalityId: ctx.municipalityId},
      orderBy: [{resource: "asc"}, {action: "asc"}],
    });
  }),

  createRole: permissionProcedure("RBAC.ROLE_WRITE")
    .input(
      z.object({
        name: z.string().min(2).max(80),
        description: z.string().max(400).optional(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      return ctx.prisma.role.create({
        data: {
          municipalityId: ctx.municipalityId,
          name: input.name,
          description: input.description,
        },
      });
    }),

  updateRole: permissionProcedure("RBAC.ROLE_WRITE")
    .input(
      z.object({
        roleId: z.string().min(1),
        name: z.string().min(2).max(80),
        description: z.string().max(400).optional().nullable(),
      }),
    )
    .mutation(async ({ctx, input}) => {
      return ctx.prisma.role.update({
        where: {id: input.roleId, municipalityId: ctx.municipalityId},
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  setRolePermissions: permissionProcedure("RBAC.PERMISSION_ASSIGN")
    .input(
      z.object({
        roleId: z.string().min(1),
        permissionIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ctx, input}) => {
      const role = await ctx.prisma.role.findFirstOrThrow({
        where: {id: input.roleId, municipalityId: ctx.municipalityId},
      });

      const permissions = await ctx.prisma.permission.findMany({
        where: {
          municipalityId: ctx.municipalityId,
          id: {in: input.permissionIds},
        },
      });

      await ctx.prisma.rolePermission.deleteMany({where: {roleId: role.id}});
      if (permissions.length > 0) {
        await ctx.prisma.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          })),
        });
      }

      return {ok: true};
    }),
});
