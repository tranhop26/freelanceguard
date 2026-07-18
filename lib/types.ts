export type UserRole = 'client' | 'freelancer' | 'both';
export type JobStatus = 'open' | 'in_progress' | 'submitted' | 'approved' | 'disputed' | 'resolved' | 'refunded';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface User {
  id: string;
  email: string;
  wallet_address: string | null;
  circle_user_id: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  role: UserRole;
  country: string | null;
  reputation_score: number;
  jobs_completed: number;
  jobs_posted: number;
  disputes_count: number;
  created_at: string;
}

export interface Job {
  id: string;
  onchain_job_id: number | null;
  client_id: string;
  freelancer_id: string | null;
  title: string;
  description: string;
  criteria: string;
  category: string;
  amount_usdc: number;
  deadline: string;
  status: JobStatus;
  deliverable_url: string | null;
  deliverable_notes: string | null;
  dispute_reason: string | null;
  ai_verdict: AIVerdict | null;
  create_tx_hash: string | null;
  resolve_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  client?: User;
  freelancer?: User;
  applications?: Application[];
  messages?: Message[];
}

export interface Application {
  id: string;
  job_id: string;
  freelancer_id: string;
  cover_letter: string | null;
  proposed_amount: number | null;
  status: ApplicationStatus;
  created_at: string;
  freelancer?: User;
}

export interface Message {
  id: string;
  job_id: string;
  sender_id: string;
  content: string;
  attachment_url: string | null;
  created_at: string;
  sender?: User;
}

export interface AIVerdict {
  verdict: 'FULL_RELEASE' | 'PARTIAL_RELEASE' | 'FULL_REFUND';
  freelancer_percentage: number;
  reasoning: string;
  confidence: number;
  resolved_at: string;
  tx_hash?: string;
  key_evidence?: string[];
}
