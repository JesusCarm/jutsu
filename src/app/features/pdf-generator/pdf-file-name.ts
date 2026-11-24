export class PdfFileName {
  fromBandName(name: string): string {
    let stem = name.normalize('NFC').trim().replace(/\.pdf$/i, '')
      .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '-')
      .replace(/\s+/gu, '-').replace(/-+/g, '-').replace(/^[. -]+|[. -]+$/g, '');
    stem = Array.from(stem).slice(0, 100).join('').replace(/[. -]+$/g, '');
    return stem ? `jutsu-squad-${stem}.pdf` : 'jutsu-squad.pdf';
  }
}
