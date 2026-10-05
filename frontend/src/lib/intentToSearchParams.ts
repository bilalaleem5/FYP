/** Map NLU `intent` from /api/chat into /search query string (SQL listings filters). */
export function intentToSearchParams(intent: Record<string, unknown> | null | undefined): string {
  if (!intent || typeof intent !== 'object') return '';
  const p = new URLSearchParams();

  const pick = (k: string): string => {
    const v = intent[k];
    if (v === null || v === undefined || v === '') return '';
    return String(v).trim();
  };

  const make = pick('make');
  const city = pick('city');
  const model = pick('model');
  const q = pick('search_text');

  if (make) p.set('make', make);
  if (city) p.set('city', city);
  if (model && !q) p.set('q', model);
  else if (q) p.set('q', q);

  const num = (k: string) => {
    const v = intent[k];
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n) : null;
  };

  const minP = num('min_price');
  const maxP = num('max_price');
  const minY = num('min_year');
  const maxY = num('max_year');
  if (minP != null) p.set('min_price', String(minP));
  if (maxP != null) p.set('max_price', String(maxP));
  if (minY != null) p.set('min_year', String(minY));
  if (maxY != null) p.set('max_year', String(maxY));

  return p.toString();
}
