import {AllocationStatus, Prisma} from "@prisma/client";
import {prisma} from "@/src/server/prisma";

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value == null) {
    return 0;
  }
  return Number(value);
}

export async function getSchoolOverview(params: {schoolId: string; academicYearId: string; includeDraft: boolean}) {
  const [frames, demands, contracts] = await Promise.all([
    prisma.municipalityFrameAllocation.findMany({
      where: {schoolId: params.schoolId, academicYearId: params.academicYearId},
      include: {category: true},
    }),
    prisma.resourceDemand.findMany({
      where: {schoolId: params.schoolId, academicYearId: params.academicYearId},
      include: {category: true},
    }),
    prisma.employmentContract.findMany({
      where: {academicYearId: params.academicYearId, staff: {schoolId: params.schoolId}},
      include: {
        staff: true,
        allocations: {
          where: params.includeDraft ? undefined : {status: AllocationStatus.CONFIRMED},
          include: {category: true},
        },
      },
    }),
  ]);

  const categoryCodes = new Set<string>([
    ...frames.map((f) => f.category.code),
    ...demands.map((d) => d.category.code),
    ...contracts.flatMap((c) => c.allocations.map((a) => a.category.code)),
  ]);

  const byCategory = [...categoryCodes].map((categoryCode) => {
    const frameFte = frames
      .filter((f) => f.category.code === categoryCode)
      .reduce((sum, row) => sum + toNumber(row.allocatedFte), 0);

    const demandFte = demands
      .filter((d) => d.category.code === categoryCode)
      .reduce((sum, row) => sum + toNumber(row.demandedFte), 0);

    const allocatedFte = contracts
      .flatMap((c) => c.allocations)
      .filter((a) => a.category.code === categoryCode)
      .reduce((sum, row) => sum + toNumber(row.allocatedFte), 0);

    return {
      categoryCode,
      frameFte,
      demandFte,
      allocatedFte,
    };
  });

  const contractsWithHealth = contracts.map((contract) => {
    const totalAllocated = contract.allocations.reduce((sum, allocation) => sum + toNumber(allocation.allocatedFte), 0);
    const baseFte = toNumber(contract.baseFte);
    const remaining = baseFte - totalAllocated;

    return {
      id: contract.id,
      staffName: `${contract.staff.firstName} ${contract.staff.lastName}`,
      isLeader: contract.staff.isLeader,
      baseFte,
      allocatedFte: totalAllocated,
      remainingContractCapacityFte: remaining,
      hasOverAllocation: totalAllocated > baseFte,
      hasNegativeRemaining: remaining < 0,
      hasLargeUnallocated: remaining > 0.2,
      allocations: contract.allocations.map((allocation) => ({
        id: allocation.id,
        categoryCode: allocation.category.code,
        allocatedFte: toNumber(allocation.allocatedFte),
        status: allocation.status,
      })),
    };
  });

  return {
    byCategory,
    contracts: contractsWithHealth,
  };
}
