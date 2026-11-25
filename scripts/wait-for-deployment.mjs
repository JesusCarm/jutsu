import { setTimeout } from 'node:timers/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function waitForDeployment({ url, commit, fetch: request = fetch, attempts = 60, intervalMs = 5000 }) {
  const base = new URL(url.endsWith('/') ? url : url + '/');
  if (base.protocol !== 'https:' || base.username || base.password) throw new Error('APP_URL must be a public HTTPS URL without credentials.');
  if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('The expected deployment commit must be a full Git SHA.');

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const infoUrl = new URL('build-info.json', base);
      infoUrl.searchParams.set('release', commit);
      infoUrl.searchParams.set('attempt', String(attempt));
      const info = await request(infoUrl, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (info.ok && (await info.json()).commit === commit) {
        const health = await request(new URL('healthz', base), { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (health.ok) return;
      }
    } catch {
      // CapRover can briefly interrupt requests while replacing the service.
    }
    if (attempt + 1 < attempts) await setTimeout(intervalMs);
  }
  throw new Error('The requested commit did not become healthy. Check CapRover deployment logs and the configured APP_URL.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.env.APP_URL || !process.env.APP_COMMIT) throw new Error('APP_URL and APP_COMMIT are required.');
  await waitForDeployment({ url: process.env.APP_URL, commit: process.env.APP_COMMIT });
  console.log('The requested release is healthy.');
}
