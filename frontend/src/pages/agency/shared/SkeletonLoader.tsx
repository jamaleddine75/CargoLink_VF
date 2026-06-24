import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

export const KPISkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="bg-accent/10 border border-border/40 p-8 rounded-[40px] h-48">
        <Skeleton className="w-12 h-12 rounded-2xl bg-accent/30 mb-8" />
        <Skeleton className="h-4 w-20 bg-accent/30 mb-4" />
        <Skeleton className="h-10 w-32 bg-accent/30" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton = () => (
  <div className="bg-accent/10 border border-border/40 p-10 rounded-[40px] h-[500px]">
    <div className="flex justify-between mb-12">
      <div>
        <Skeleton className="h-8 w-48 bg-accent/30 mb-4" />
        <Skeleton className="h-4 w-64 bg-accent/30" />
      </div>
      <Skeleton className="h-10 w-24 bg-accent/30 rounded-full" />
    </div>
    <Skeleton className="w-full h-[300px] bg-accent/30 rounded-2xl" />
  </div>
);

export const ListSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 rounded-3xl bg-accent/10 border border-border/40 h-32 flex items-center gap-6">
        <Skeleton className="w-14 h-14 rounded-2xl bg-accent/30" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48 bg-accent/30" />
          <Skeleton className="h-4 w-64 bg-accent/30" />
        </div>
      </div>
    ))}
  </div>
);
