import { Star } from 'lucide-react';

interface ReputationBadgeProps {
  jobsCompleted: number;
  avgRating: number; // e.g. 4.8
}

export function ReputationBadge({ jobsCompleted, avgRating }: ReputationBadgeProps) {
  // Generate array for star rendering
  const roundedStars = Math.round(avgRating);
  
  return (
    <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold text-slate-700">
      <div className="flex items-center text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i < roundedStars ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500">
        {avgRating.toFixed(1)} ({jobsCompleted} {jobsCompleted === 1 ? 'job' : 'jobs'})
      </span>
    </div>
  );
}
