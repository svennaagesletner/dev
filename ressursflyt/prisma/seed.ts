import bcrypt from "bcryptjs";
import {
  AcademicYearStatus,
  AllocationStatus,
  AuthProvider,
  Locale,
  PrismaClient,
  ResourceCategoryCode,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {PERMISSIONS, STARTER_ROLES} from "@/src/server/auth/permissions";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for prisma seed");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const municipality = await prisma.municipality.upsert({
    where: {id: "demo-municipality"},
    update: {name: "Demo kommune", defaultLocale: Locale.nb},
    create: {
      id: "demo-municipality",
      name: "Demo kommune",
      defaultLocale: Locale.nb,
    },
  });

  const school = await prisma.school.upsert({
    where: {id: "demo-school"},
    update: {name: "Demo skole", municipalityId: municipality.id},
    create: {
      id: "demo-school",
      municipalityId: municipality.id,
      name: "Demo skole",
    },
  });

  const fteCalendar = await prisma.fteCalendar.upsert({
    where: {id: "demo-calendar"},
    update: {
      municipalityId: municipality.id,
      annualMinutesPerFte: 100800,
      weeklyMinutesPerFte: 2250,
    },
    create: {
      id: "demo-calendar",
      municipalityId: municipality.id,
      annualMinutesPerFte: 100800,
      weeklyMinutesPerFte: 2250,
    },
  });

  await prisma.municipalitySettings.upsert({
    where: {municipalityId: municipality.id},
    update: {
      defaultFteCalendarId: fteCalendar.id,
      allowYearUnlock: true,
      requireTwoStepImplement: true,
    },
    create: {
      municipalityId: municipality.id,
      defaultFteCalendarId: fteCalendar.id,
      allowYearUnlock: true,
      requireTwoStepImplement: true,
    },
  });

  const unitProfile = await prisma.unitProfile.upsert({
    where: {id: "demo-unit-profile"},
    update: {
      schoolId: school.id,
      name: "Undervisningstime",
      minutesPerUnit: 45,
      roundingMode: "HALF_UP",
    },
    create: {
      id: "demo-unit-profile",
      schoolId: school.id,
      name: "Undervisningstime",
      minutesPerUnit: 45,
      roundingMode: "HALF_UP",
    },
  });

  await prisma.school.update({
    where: {id: school.id},
    data: {defaultUnitProfileId: unitProfile.id},
  });

  const permissionByCode = new Map<string, string>();
  for (const permission of PERMISSIONS) {
    const row = await prisma.permission.upsert({
      where: {
        municipalityId_code: {
          municipalityId: municipality.id,
          code: permission.code,
        },
      },
      update: {
        resource: permission.resource,
        action: permission.action,
        descriptionKey: permission.descriptionKey,
      },
      create: {
        municipalityId: municipality.id,
        code: permission.code,
        resource: permission.resource,
        action: permission.action,
        descriptionKey: permission.descriptionKey,
      },
    });

    permissionByCode.set(permission.code, row.id);
  }

  for (const [sortOrder, code] of [ResourceCategoryCode.TEACHER, ResourceCategoryCode.ASSISTANT, ResourceCategoryCode.SFO].entries()) {
    await prisma.resourceCategory.upsert({
      where: {
        municipalityId_code: {
          municipalityId: municipality.id,
          code,
        },
      },
      update: {
        nameKey: `resource.${code.toLowerCase()}`,
        sortOrder,
      },
      create: {
        municipalityId: municipality.id,
        code,
        nameKey: `resource.${code.toLowerCase()}`,
        sortOrder,
      },
    });
  }

  let municipalityAdminRoleId = "";
  for (const starterRole of STARTER_ROLES) {
    const role = await prisma.role.upsert({
      where: {
        municipalityId_name: {
          municipalityId: municipality.id,
          name: starterRole.name,
        },
      },
      update: {
        description: starterRole.description,
        isSystemTemplate: starterRole.isSystemTemplate,
      },
      create: {
        municipalityId: municipality.id,
        name: starterRole.name,
        description: starterRole.description,
        isSystemTemplate: starterRole.isSystemTemplate,
      },
    });

    if (starterRole.name === "Municipality Admin") {
      municipalityAdminRoleId = role.id;
    }

    await prisma.rolePermission.deleteMany({where: {roleId: role.id}});
    const permissionIds = starterRole.permissionCodes
      .map((code) => permissionByCode.get(code))
      .filter((id): id is string => Boolean(id));

    if (permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({roleId: role.id, permissionId})),
      });
    }
  }

  const user = await prisma.user.upsert({
    where: {email: "admin@example.com"},
    update: {name: "Admin User", localeOverride: Locale.nb},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      localeOverride: Locale.nb,
    },
  });

  const passwordHash = await bcrypt.hash("Admin1234!", 12);
  await prisma.passwordCredential.upsert({
    where: {userId: user.id},
    update: {passwordHash},
    create: {userId: user.id, passwordHash},
  });

  await prisma.accountIdentity.upsert({
    where: {
      provider_providerSubject: {
        provider: AuthProvider.LOCAL_PASSWORD,
        providerSubject: user.id,
      },
    },
    update: {
      email: user.email,
      lastLoginAt: new Date(),
    },
    create: {
      userId: user.id,
      provider: AuthProvider.LOCAL_PASSWORD,
      providerSubject: user.id,
      email: user.email,
      lastLoginAt: new Date(),
    },
  });

  const membership = await prisma.membership.findFirst({
    where: {
      userId: user.id,
      municipalityId: municipality.id,
      schoolId: null,
      roleId: municipalityAdminRoleId,
    },
  });

  if (!membership) {
    await prisma.membership.create({
      data: {
        userId: user.id,
        municipalityId: municipality.id,
        roleId: municipalityAdminRoleId,
      },
    });
  }

  const currentYear = await prisma.academicYear.upsert({
    where: {id: "demo-year-2025-2026"},
    update: {
      municipalityId: municipality.id,
      name: "2025/2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-07-31"),
      status: AcademicYearStatus.ACTIVE,
    },
    create: {
      id: "demo-year-2025-2026",
      municipalityId: municipality.id,
      name: "2025/2026",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-07-31"),
      status: AcademicYearStatus.ACTIVE,
    },
  });

  const categories = await prisma.resourceCategory.findMany({where: {municipalityId: municipality.id}});
  const categoryByCode = new Map(categories.map((category) => [category.code, category.id]));

  const teacherId = categoryByCode.get(ResourceCategoryCode.TEACHER)!;
  const assistantId = categoryByCode.get(ResourceCategoryCode.ASSISTANT)!;
  const sfoId = categoryByCode.get(ResourceCategoryCode.SFO)!;

  for (const demand of [
    {categoryId: teacherId, demandedFte: "28.500"},
    {categoryId: assistantId, demandedFte: "10.250"},
    {categoryId: sfoId, demandedFte: "7.000"},
  ]) {
    await prisma.resourceDemand.upsert({
      where: {
        schoolId_academicYearId_categoryId: {
          schoolId: school.id,
          academicYearId: currentYear.id,
          categoryId: demand.categoryId,
        },
      },
      update: {demandedFte: demand.demandedFte},
      create: {
        schoolId: school.id,
        academicYearId: currentYear.id,
        categoryId: demand.categoryId,
        demandedFte: demand.demandedFte,
      },
    });
  }

  for (const frame of [
    {categoryId: teacherId, allocatedFte: "27.000"},
    {categoryId: assistantId, allocatedFte: "9.500"},
    {categoryId: sfoId, allocatedFte: "6.500"},
  ]) {
    await prisma.municipalityFrameAllocation.upsert({
      where: {
        municipalityId_academicYearId_schoolId_categoryId: {
          municipalityId: municipality.id,
          academicYearId: currentYear.id,
          schoolId: school.id,
          categoryId: frame.categoryId,
        },
      },
      update: {allocatedFte: frame.allocatedFte},
      create: {
        municipalityId: municipality.id,
        academicYearId: currentYear.id,
        schoolId: school.id,
        categoryId: frame.categoryId,
        allocatedFte: frame.allocatedFte,
      },
    });
  }

  const staff = await prisma.staff.upsert({
    where: {id: "demo-staff-1"},
    update: {
      schoolId: school.id,
      firstName: "Kari",
      lastName: "Nordmann",
      isLeader: true,
      active: true,
    },
    create: {
      id: "demo-staff-1",
      schoolId: school.id,
      firstName: "Kari",
      lastName: "Nordmann",
      isLeader: true,
      active: true,
    },
  });

  const contract = await prisma.employmentContract.upsert({
    where: {staffId_academicYearId: {staffId: staff.id, academicYearId: currentYear.id}},
    update: {
      baseFte: "1.000",
      notes: "Demo contract",
    },
    create: {
      staffId: staff.id,
      academicYearId: currentYear.id,
      baseFte: "1.000",
      notes: "Demo contract",
    },
  });

  await prisma.staffAllocation.upsert({
    where: {
      contractId_categoryId_status: {
        contractId: contract.id,
        categoryId: teacherId,
        status: AllocationStatus.CONFIRMED,
      },
    },
    update: {
      allocatedFte: "0.800",
    },
    create: {
      contractId: contract.id,
      categoryId: teacherId,
      allocatedFte: "0.800",
      status: AllocationStatus.CONFIRMED,
    },
  });

  await prisma.studentGroup.upsert({
    where: {
      academicYearId_schoolId_trinn_classCode: {
        academicYearId: currentYear.id,
        schoolId: school.id,
        trinn: 5,
        classCode: "5A",
      },
    },
    update: {
      totalCount: 24,
      maleCount: 13,
      femaleCount: 11,
    },
    create: {
      academicYearId: currentYear.id,
      schoolId: school.id,
      trinn: 5,
      classCode: "5A",
      totalCount: 24,
      maleCount: 13,
      femaleCount: 11,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
