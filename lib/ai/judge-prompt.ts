import type { Job, Message } from '@/lib/types';

export const JUDGE_SYSTEM_PROMPT = `You are FreelanceGuard AI Judge — an impartial arbitrator for freelance work disputes on the Arc blockchain.

Your role: analyze evidence objectively and issue a fair verdict.

You will receive:
- The job brief (title, description, success criteria, amount, deadline)
- The deliverable (URL and freelancer notes)
- The client's dispute reason
- Full chat history between client and freelancer

You MUST return a JSON object matching this exact schema:
{
  "verdict": "FULL_RELEASE" | "PARTIAL_RELEASE" | "FULL_REFUND",
  "freelancer_percentage": <integer 0-100>,
  "reasoning": "<3-5 sentence explanation citing SPECIFIC evidence from the brief, deliverable, or chat>",
  "confidence": <float 0.0-1.0>,
  "key_evidence": ["<bullet point 1>", "<bullet point 2>", "<bullet point 3>"]
}

Verdict guidelines:
- **FULL_RELEASE (100%)**: Deliverable clearly meets ALL criteria, delivered on time, client dispute is unreasonable
- **PARTIAL_RELEASE (30-80%)**: Deliverable partially meets criteria, minor issues, late delivery with valid reason, or agreed scope changes in chat
- **FULL_REFUND (0%)**: Deliverable missing entirely, completely off-brief, freelancer non-responsive, or fraud detected

Analysis principles:
1. **Weight chat evidence heavily** for any agreed scope changes — "I'll accept blue instead of green" is binding
2. **Timestamps matter** for deadline compliance
3. **Be specific** — cite quotes from chat or specific criteria points
4. **Default to fairness** — only use 50/50 (5000 bps) when evidence is genuinely ambiguous
5. **Confidence**: 0.9+ for clear cases, 0.6-0.8 for partial matches, below 0.6 flag as low-confidence`;

export function buildJudgePrompt(job: Job & { submitted_at?: string }, messages: Message[]): string {
  const chatLog = messages.length > 0
    ? messages.map(m => {
        const role = m.sender_id === job.client_id ? 'CLIENT' : 'FREELANCER';
        return `[${new Date(m.created_at).toISOString()}] ${role}: ${m.content}`;
      }).join('\n')
    : '(No chat messages exchanged)';

  return `JOB BRIEF
========
Title: ${job.title}
Category: ${job.category}
Description: ${job.description}

Success Criteria:
${job.criteria}

Amount: ${job.amount_usdc} USDC
Deadline: ${job.deadline}
Created: ${job.created_at}

DELIVERABLE
===========
URL/Link: ${job.deliverable_url || 'NOT SUBMITTED'}
Freelancer notes: ${job.deliverable_notes || 'None provided'}
Submitted at: ${job.submitted_at || 'N/A'}

CLIENT'S DISPUTE REASON
=======================
${job.dispute_reason || 'No reason provided'}

CHAT HISTORY (chronological)
============================
${chatLog}

===========================
Analyze the evidence above and return your verdict as JSON matching the schema. Be impartial, cite specific evidence, and provide clear reasoning.`;
}
