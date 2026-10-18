import React from 'react';

const paths = {
  screen: <><rect x="3" y="3" width="26" height="18" rx="3"/><path d="M11 28h10m-5-7v7M7 8h18"/></>,
  server: <><rect x="6" y="2" width="20" height="28" rx="3"/><path d="M6 11h20M6 21h20M11 7h1m-1 9h1m-1 10h1M17 7h5m-5 9h5m-5 10h5"/></>,
  database: <><ellipse cx="16" cy="6" rx="12" ry="4"/><path d="M4 6v20c0 5 24 5 24 0V6M4 15c0 5 24 5 24 0"/></>,
  globe: <><circle cx="16" cy="16" r="13"/><ellipse cx="16" cy="16" rx="6" ry="13"/><path d="M3 16h26M6 8h20M6 24h20"/></>,
  lock: <><rect x="6" y="13" width="20" height="16" rx="3"/><path d="M10 13V8a6 6 0 0 1 12 0v5M16 19v4"/></>,
  document: <><path d="M7 2h12l7 7v21H7zM19 2v8h7M11 15h11m-11 5h11m-11 5h7"/></>,
  cart: <><path d="M2 4h4l4 18h16l4-13H8M11 27h1m12 0h1"/><circle cx="12" cy="27" r="2"/><circle cx="25" cy="27" r="2"/></>,
  card: <><rect x="2" y="6" width="28" height="20" rx="4"/><path d="M2 12h28M7 21h7m4 0h3"/></>,
  package: <><path d="M3 9l13-7 13 7v15l-13 7-13-7zM3 9l13 7 13-7M16 16v15M10 5l13 7v7"/></>,
  truck: <><path d="M2 6h17v18H2zM19 13h6l5 6v5H19M22 14v6h7"/><circle cx="8" cy="25" r="4"/><circle cx="24" cy="25" r="4"/></>,
  home: <><path d="M2 15L16 3l14 12M6 12v17h20V12M12 29V18h8v11"/></>,
  wallet: <><path d="M27 8H5V4h20v4M5 8a3 3 0 0 0-3 3v15a3 3 0 0 0 3 3h24V8zM22 15h8v8h-8zM25 19h1"/></>,
  bank: <><path d="M2 10l14-8 14 8zM4 29h24M7 14v11m9-11v11m9-11v11M2 26h28"/></>,
  coin: <><circle cx="16" cy="16" r="13"/><path d="M10 9l6 7 6-7M16 16v9m-6-7h12m-12 4h12"/></>,
  person: <><circle cx="16" cy="9" r="6"/><path d="M4 29v-4c0-11 24-11 24 0v4z"/></>,
  store: <><path d="M4 13v17h24V13M2 13l4-10h20l4 10M2 13c0 6 7 6 7 0 0 6 7 6 7 0 0 6 7 6 7 0 0 6 7 6 7 0M11 30V20h10v10"/></>,
  leaf: <><path d="M27 3C5 0-2 22 11 27 24 32 31 16 27 3zM5 30L24 8M13 21l-1-8m8 1h6"/></>,
  sun: <><circle cx="16" cy="16" r="7"/><path d="M16 0v4m0 24v4M0 16h4m24 0h4M4 4l3 3m18 18 3 3M4 28l3-3M25 7l3-3"/></>,
  cloud: <path d="M8 26a7 7 0 1 1-2-14A10 10 0 0 1 26 10a8 8 0 0 1-1 16z"/>,
  check: <><circle cx="16" cy="16" r="13"/><path d="M9 16l5 5 10-11"/></>,
  chart: <><path d="M3 2v27h27M8 23v-7h4v7m5 0V9h4v14m5 0V3h4v20"/></>,
};

export function Glyph({name = 'document', x = 0, y = 0, size = 42, color = 'currentColor'}) {
  return <g transform={`translate(${x - size / 2} ${y - size / 2}) scale(${size / 32})`} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</g>;
}
