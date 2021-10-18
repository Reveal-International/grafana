import { getLocale } from '@grafana/data';

export function stringHash(s: string): number {
  let hash = 0;
  if (s.length === 0) {
    return hash;
  }
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function objectHash(o: any): number {
  return stringHash(JSON.stringify(o));
}

export function formatNumber(number: number, options = {}) {
  return new Intl.NumberFormat(getLocale(), options).format(number);
}
