import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { waitForDeployment } from '../scripts/wait-for-deployment.mjs';

const temporary = [];
const COMMIT = 'a'.repeat(40);
afterEach(() => { for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true }); });

function generateConfig(id) {
  const path = mkdtempSync(join(tmpdir(), 'jutsu-runtime-config-'));
  temporary.push(path);
  const output = join(path, 'runtime-config.js');
  const result = spawnSync('sh', [join(process.cwd(), 'docker/40-runtime-config.sh'), output], {
    encoding: 'utf8', env: { PATH: process.env.PATH, GA_MEASUREMENT_ID: id },
  });
  return { result, output };
}

describe('Container runtime configuration', () => {
  it('generates a working default without an Analytics ID', () => {
    const { result, output } = generateConfig('');
    expect(result.status).toBe(0);
    const browser = {};
    runInNewContext(readFileSync(output, 'utf8'), { window: browser });
    expect(browser.__JUTSU_CONFIG__).toEqual({ gaMeasurementId: '' });
  });

  it('applies the container environment when generating browser configuration', () => {
    const { result, output } = generateConfig('G-TEST000001');
    expect(result.status).toBe(0);
    const browser = {};
    runInNewContext(readFileSync(output, 'utf8'), { window: browser });
    expect(browser.__JUTSU_CONFIG__).toEqual({ gaMeasurementId: 'G-TEST000001' });
  });

  it.each(['G-', 'G-invalid', 'UA-1234', 'G-TEST;exit 0', 'G-TEST"};throw new Error()//', 'G-TEST\nVALUE'])('rejects invalid or executable configuration: %s', (id) => {
    const { result } = generateConfig(id);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('GA_MEASUREMENT_ID must be empty or a GA4 measurement ID');
  });
});

describe('Deployment verification', () => {
  it('waits past an old image and temporary errors until the requested release is healthy', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commit: 'b'.repeat(40) }) })
      .mockRejectedValueOnce(new Error('Replacing service'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commit: COMMIT }) })
      .mockResolvedValueOnce({ ok: true });
    await waitForDeployment({ url: 'https://jutsu.example.test', commit: COMMIT, fetch: request, attempts: 3, intervalMs: 0 });
    expect(request).toHaveBeenCalledTimes(4);
    expect(String(request.mock.calls.at(-1)[0])).toBe('https://jutsu.example.test/healthz');
  });

  it('fails when CapRover serves the right commit but its health endpoint fails', async () => {
    const request = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ commit: COMMIT }) })
      .mockResolvedValueOnce({ ok: false });
    await expect(waitForDeployment({ url: 'https://jutsu.example.test/', commit: COMMIT, fetch: request, attempts: 1 })).rejects.toThrow('did not become healthy');
  });

  it('does not mistake an old healthy deployment for a successful release', async () => {
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ commit: 'b'.repeat(40) }) });
    await expect(waitForDeployment({ url: 'https://jutsu.example.test/', commit: COMMIT, fetch: request, attempts: 1 })).rejects.toThrow('did not become healthy');
  });

  it('rejects insecure production URLs before making any requests', async () => {
    const request = vi.fn();
    await expect(waitForDeployment({ url: 'http://jutsu.example.test/', commit: COMMIT, fetch: request })).rejects.toThrow('HTTPS');
    expect(request).not.toHaveBeenCalled();
  });
});
