export class PdfFileName {
  fromBandName(name: string): string {
    let stem = name.normalize('NFC').trim().replace(/\.pdf$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-')
      .replace(/\s+/gu, '-').replace(/-+/g, '-').replace(/^[. -]+|[. -]+$/g, '');
    stem = Array.from(stem).slice(0, 100).join('').replace(/[. -]+$/g, '');
    if (!stem) stem = 'jutsu-squad';
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(stem)) stem = `jutsu-${stem}`;
    return `${stem}.pdf`;
  }
}
