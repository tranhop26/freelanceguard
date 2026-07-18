import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Job, User } from '@/lib/types';
import { formatUsdc } from '@/lib/utils/format';
import { Star, Clock, Calendar } from 'lucide-react';

interface JobCardProps {
  job: Job;
  viewerRole?: 'client' | 'freelancer';
}

export function JobCard({ job, viewerRole }: JobCardProps) {
  const isClient = viewerRole === 'client';
  
  // Choose client or freelancer profile to show on card
  const partnerProfile = isClient ? job.freelancer : job.client;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold border-none">Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold border-none">In Progress</Badge>;
      case 'submitted':
        return <Badge className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold border-none">Submitted</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold border-none">Approved</Badge>;
      case 'disputed':
        return <Badge className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold border-none">Disputed</Badge>;
      case 'resolved':
        return <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border-none">Resolved</Badge>;
      case 'refunded':
        return <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border-none">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border-none">{status}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'design': return 'Design & Creative';
      case 'development': return 'Software Development';
      case 'writing': return 'Writing & Translation';
      case 'marketing': return 'Marketing';
      case 'video': return 'Video & Animation';
      case 'data': return 'Data & AI';
      default: return 'General Work';
    }
  };

  // Safe display for deadline
  const deadlineDate = new Date(job.deadline);
  const isExpired = deadlineDate.getTime() < Date.now();
  const timeLabel = isExpired 
    ? `Expired ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`
    : `Deadline ${formatDistanceToNow(deadlineDate, { addSuffix: true })}`;

  return (
    <Link href={`/jobs/${job.id}`} className="block group">
      <Card className="h-full border border-slate-200 hover:border-slate-300 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden">
        <div>
          <CardHeader className="p-5 pb-2">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {getCategoryLabel(job.category)}
              </span>
              {getStatusBadge(job.status)}
            </div>
            <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
              {job.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-2">
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {job.description}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{timeLabel}</span>
            </div>
          </CardContent>
        </div>

        <div>
          <CardContent className="px-5 py-2 pt-0">
            <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Budget</span>
                <span className="text-lg font-extrabold text-slate-800 font-mono">
                  ${formatUsdc(job.amount_usdc * 1000000)} <span className="text-[10px] text-slate-500 font-semibold font-sans">USDC</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  {isClient ? 'Freelancer' : 'Client'}
                </span>
                {partnerProfile ? (
                  <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                    <Avatar className="h-5 w-5 border border-slate-100">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-[9px] font-bold">
                        {partnerProfile.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold text-slate-700 truncate max-w-[80px]">
                      {partnerProfile.display_name || partnerProfile.email.split('@')[0]}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-400 italic">Unassigned</span>
                )}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
              <span>Reputation Score:</span>
              <span className="text-blue-700 font-bold">
                {partnerProfile ? partnerProfile.reputation_score : 0}/1000
              </span>
            </div>
            <span className="text-[10px] text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
              View Workroom &rarr;
            </span>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
