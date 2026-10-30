import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';

// A local PostgREST boundary for exercising the real routes without a real
// wallet, provider keys, or changes to the user's hosted database.
export function createDemoDatabase() {
  const tables = { users: [], jobs: [], messages: [], applications: [] };
  const fixture = { mode: 'offline', server: null, tables };
  fixture.server = createServer(async (request, response) => {
    if (fixture.mode === 'offline') {
      request.socket.destroy();
      return;
    }
    response.setHeader('Content-Type', 'application/json');
    const url = new URL(request.url, 'http://localhost');
    const table = url.pathname.replace('/rest/v1/', '');
    const rows = tables[table];
    if (!rows) {
      response.writeHead(404).end(JSON.stringify({ message: 'Unknown fixture table' }));
      return;
    }
    if ((fixture.mode === 'jobs-unavailable' && table === 'jobs') ||
        (fixture.mode === 'chat-unavailable' && table === 'messages')) {
      response.writeHead(503).end(JSON.stringify({ code: 'PGRST002', message: 'Database unavailable', details: null, hint: null }));
      return;
    }
    const matches = row => [...url.searchParams].every(([key, value]) => {
      if (!value.startsWith('eq.')) return true;
      return String(row[key]) === value.slice(3);
    });
    const decorate = row => {
      if (table === 'jobs') return {
        ...row,
        client: tables.users.find(user => user.id === row.client_id) ?? null,
        freelancer: tables.users.find(user => user.id === row.freelancer_id) ?? null,
        applications: tables.applications.filter(item => item.job_id === row.id),
        messages: tables.messages.filter(item => item.job_id === row.id).map(item => ({
          ...item, sender: tables.users.find(user => user.id === item.sender_id) ?? null,
        })),
      };
      if (table === 'messages') return { ...row, sender: tables.users.find(user => user.id === row.sender_id) ?? null };
      return row;
    };
    let result;
    if (request.method === 'GET') {
      result = rows.filter(matches);
      const limit = Number(url.searchParams.get('limit'));
      if (limit > 0) result = result.slice(0, limit);
    } else {
      let text = '';
      for await (const chunk of request) text += chunk;
      const values = text ? JSON.parse(text) : {};
      if (request.method === 'POST') {
        const existing = table === 'users' && rows.find(row => row.email === values.email);
        if (existing) {
          Object.assign(existing, values);
          result = [existing];
        } else {
          const row = {
            id: randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...(table === 'users' ? {
              wallet_address: null, circle_user_id: null, display_name: null,
              bio: null, avatar_url: null, country: null, role: 'both',
              reputation_score: 0, jobs_completed: 0, jobs_posted: 0, disputes_count: 0,
            } : {}),
            ...(table === 'jobs' ? {
              onchain_job_id: null, freelancer_id: null, category: 'other', status: 'open',
              deliverable_url: null, deliverable_notes: null, dispute_reason: null,
              ai_verdict: null, create_tx_hash: null, resolve_tx_hash: null,
            } : {}),
            ...values,
          };
          rows.push(row);
          result = [row];
        }
      } else if (request.method === 'PATCH') {
        result = rows.filter(matches).map(row => Object.assign(row, values));
      } else {
        response.writeHead(405).end(JSON.stringify({ message: 'Unsupported fixture method' }));
        return;
      }
    }
    result = result.map(decorate);
    if (request.headers.accept?.includes('application/vnd.pgrst.object+json')) {
      if (result.length !== 1) {
        response.writeHead(406).end(JSON.stringify({ code: 'PGRST116', message: 'Expected one row', details: null, hint: null }));
        return;
      }
      result = result[0];
    }
    response.writeHead(request.method === 'POST' ? 201 : 200);
    response.end(JSON.stringify(result));
  });
  return fixture;
}
