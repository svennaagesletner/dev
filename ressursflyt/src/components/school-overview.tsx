"use client";

import {trpc} from "@/src/trpc/react";

export function SchoolOverview({schoolId, yearId}: {schoolId: string; yearId: string}) {
  const overview = trpc.school.overview.useQuery({schoolId, yearId, includeDraft: true}, {enabled: Boolean(schoolId && yearId)});

  if (overview.isLoading) {
    return <p>Loading...</p>;
  }

  if (overview.error) {
    return <p className="text-red-600">{overview.error.message}</p>;
  }

  if (!overview.data) {
    return <p>No data</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{overview.data.school.name} • {overview.data.year.name}</h1>

      <div className="grid gap-3 md:grid-cols-3">
        {overview.data.byCategory.map((category) => (
          <div key={category.categoryCode} className="rounded border p-3">
            <p className="font-medium">{category.categoryCode}</p>
            <p className="text-sm">Frame: {category.frameFte.toFixed(3)} FTE</p>
            <p className="text-sm">Demand: {category.demandFte.toFixed(3)} FTE</p>
            <p className="text-sm">Allocated: {category.allocatedFte.toFixed(3)} FTE</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {overview.data.contracts.map((contract) => (
          <div key={contract.id} className="rounded border p-3">
            <p className="font-medium">{contract.staffName} {contract.isLeader ? "(Leader)" : ""}</p>
            <p className="text-sm">Base: {contract.baseFte.toFixed(3)} • Allocated: {contract.allocatedFte.toFixed(3)} • Remaining: {contract.remainingContractCapacityFte.toFixed(3)}</p>
            {(contract.hasOverAllocation || contract.hasNegativeRemaining || contract.hasLargeUnallocated) ? (
              <p className="text-sm text-amber-700">Warning: mismatch detected.</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
