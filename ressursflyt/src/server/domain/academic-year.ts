import {AllocationStatus, AcademicYearStatus} from "@prisma/client";
import {TRPCError} from "@trpc/server";
import {prisma} from "@/src/server/prisma";

export async function createAcademicYearFromTemplate(params: {
  municipalityId: string;
  templateYearId: string;
  newYear: {name: string; startDate: Date; endDate: Date};
}) {
  return prisma.$transaction(async (tx) => {
    const templateYear = await tx.academicYear.findFirst({
      where: {
        id: params.templateYearId,
        municipalityId: params.municipalityId,
      },
    });

    if (!templateYear) {
      throw new TRPCError({code: "NOT_FOUND", message: "Template year not found"});
    }

    const newYear = await tx.academicYear.create({
      data: {
        municipalityId: params.municipalityId,
        name: params.newYear.name,
        startDate: params.newYear.startDate,
        endDate: params.newYear.endDate,
        templateFromYearId: params.templateYearId,
        status: AcademicYearStatus.DRAFT,
      },
    });

    const templateGroups = await tx.studentGroup.findMany({
      where: {
        academicYearId: params.templateYearId,
        school: {municipalityId: params.municipalityId},
        trinn: {gte: 1, lte: 9},
      },
    });

    if (templateGroups.length > 0) {
      await tx.studentGroup.createMany({
        data: templateGroups.map((group) => ({
          schoolId: group.schoolId,
          academicYearId: newYear.id,
          trinn: group.trinn + 1,
          classCode: group.classCode,
          totalCount: group.totalCount,
          maleCount: group.maleCount,
          femaleCount: group.femaleCount,
        })),
      });
    }

    const templateContracts = await tx.employmentContract.findMany({
      where: {
        academicYearId: params.templateYearId,
        staff: {school: {municipalityId: params.municipalityId}},
      },
      include: {allocations: true},
    });

    const contractMap = new Map<string, string>();
    for (const contract of templateContracts) {
      const created = await tx.employmentContract.create({
        data: {
          staffId: contract.staffId,
          academicYearId: newYear.id,
          baseFte: contract.baseFte,
          startDate: contract.startDate,
          endDate: contract.endDate,
          notes: contract.notes,
        },
      });
      contractMap.set(contract.id, created.id);
    }

    const demands = await tx.resourceDemand.findMany({
      where: {
        academicYearId: params.templateYearId,
        school: {municipalityId: params.municipalityId},
      },
    });

    if (demands.length > 0) {
      await tx.resourceDemand.createMany({
        data: demands.map((demand) => ({
          schoolId: demand.schoolId,
          academicYearId: newYear.id,
          categoryId: demand.categoryId,
          demandedFte: demand.demandedFte,
          comment: demand.comment,
        })),
      });
    }

    const allocations = templateContracts.flatMap((contract) =>
      contract.allocations.map((allocation) => ({
        ...allocation,
        newContractId: contractMap.get(allocation.contractId),
      })),
    );

    for (const allocation of allocations) {
      if (!allocation.newContractId) {
        continue;
      }

      await tx.staffAllocation.create({
        data: {
          contractId: allocation.newContractId,
          categoryId: allocation.categoryId,
          allocatedFte: allocation.allocatedFte,
          status: AllocationStatus.DRAFT,
          copiedFromAllocationId: allocation.id,
          notes: allocation.notes,
        },
      });
    }

    return newYear;
  });
}

export async function assertYearEditable(params: {
  municipalityId: string;
  academicYearId: string;
  canEditWhenLocked: boolean;
}) {
  const year = await prisma.academicYear.findFirst({
    where: {
      id: params.academicYearId,
      municipalityId: params.municipalityId,
    },
  });

  if (!year) {
    throw new TRPCError({code: "NOT_FOUND", message: "Academic year not found"});
  }

  if (year.status === AcademicYearStatus.LOCKED && !params.canEditWhenLocked) {
    throw new TRPCError({code: "FORBIDDEN", message: "Academic year is locked"});
  }

  return year;
}
