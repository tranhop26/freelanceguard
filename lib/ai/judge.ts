import OpenAI from 'openai';
import { JUDGE_SYSTEM_PROMPT, buildJudgePrompt } from './judge-prompt';
import type { Job, Message, AIVerdict } from '@/lib/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['FULL_RELEASE', 'PARTIAL_RELEASE', 'FULL_REFUND'] },
    freelancer_percentage: { type: 'integer', minimum: 0, maximum: 100 },
    reasoning: { type: 'string', minLength: 50, maxLength: 800 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    key_evidence: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
  },
  required: ['verdict', 'freelancer_percentage', 'reasoning', 'confidence', 'key_evidence'],
  additionalProperties: false,
};

export async function runAIJudge(job: Job, messages: Message[]): Promise<Omit<AIVerdict, 'resolved_at' | 'tx_hash'>> {
  const userPrompt = buildJudgePrompt(job as any, messages);
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: JUDGE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'DisputeVerdict',
        strict: true,
        schema: VERDICT_SCHEMA,
      },
    },
    temperature: 0.3,
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return parsed;
}
