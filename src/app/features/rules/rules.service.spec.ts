import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { RULE_DOCUMENT_FETCH, RulesService } from './rules.service';

describe('RulesService', () => {
  const markdown = '<a id="interaction-distance"></a>\n### DI\n\n1″.\n\n<a id="line-of-sight"></a>\n### LDV\n\n180°.';

  it('loads only requested documents, shares concurrent requests and respects a subdirectory base URL', async () => {
    const fetch = vi.fn().mockResolvedValue(markdown);
    TestBed.configureTestingModule({ providers: [
      { provide: DOCUMENT, useValue: { baseURI: 'https://example.test/jutsu/' } },
      { provide: RULE_DOCUMENT_FETCH, useValue: fetch },
    ] });
    const service = TestBed.inject(RulesService);
    expect(fetch).not.toHaveBeenCalled();
    const sections = await Promise.all([service.load('interaction-distance', 'es'), service.load('line-of-sight', 'es')]);
    expect(sections.map((section) => section.title)).toEqual(['DI', 'LDV']);
    expect(fetch).toHaveBeenCalledExactlyOnceWith('https://example.test/jutsu/assets/rules/es/basic-concepts.md');
    expect(service.imageUrl('assets/diagrams/di.svg')).toBe('https://example.test/jutsu/assets/diagrams/di.svg');
    await service.load('interaction-distance', 'es');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('allows retrying failed requests and documents with missing anchors', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce('<html>App fallback</html>').mockResolvedValue(markdown);
    TestBed.configureTestingModule({ providers: [{ provide: RULE_DOCUMENT_FETCH, useValue: fetch }] });
    const service = TestBed.inject(RulesService);
    await expect(service.load('interaction-distance', 'es')).rejects.toThrow('Offline');
    await expect(service.load('interaction-distance', 'es')).rejects.toThrow('Missing rule section');
    expect((await service.load('interaction-distance', 'es')).title).toBe('DI');
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('keeps document caches and failures separate for each language', async () => {
    let failEnglish = true;
    const fetch = vi.fn(async (url: string) => {
      if (url.includes('/en/')) {
        if (failEnglish) { failEnglish = false; throw new Error('English unavailable'); }
        return markdown.replace('### DI', '### Engagement Range').replace('### LDV', '### Line of Sight');
      }
      return markdown;
    });
    TestBed.configureTestingModule({ providers: [{ provide: RULE_DOCUMENT_FETCH, useValue: fetch }] });
    const service = TestBed.inject(RulesService);
    expect((await service.load('interaction-distance', 'es')).title).toBe('DI');
    await expect(service.load('interaction-distance', 'en')).rejects.toThrow('English unavailable');
    expect((await service.load('line-of-sight', 'es')).title).toBe('LDV');
    expect((await service.load('interaction-distance', 'en')).title).toBe('Engagement Range');
    expect((await service.load('line-of-sight', 'en')).title).toBe('Line of Sight');
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
