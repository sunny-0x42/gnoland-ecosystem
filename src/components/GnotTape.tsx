"use client";

import { useEffect, useState } from "react";

type Exchange = {
  name: string;
  pair: string;
  href: string;
  price: number | null;
  change: number | null;
  volumeQuote: number | null;
};

type Point = { t: number; close: number; volume: number; up: boolean };

type Market = {
  ok: true;
  exchanges: Exchange[];
  chart: { source: string; pair: string; points: Point[] };
};

const LINKS = [
  { name: "KuCoin", pair: "GNOT/USDT", href: "https://www.kucoin.com/trade/GNOT-USDT" },
  { name: "Kraken", pair: "GNOT/USD", href: "https://pro.kraken.com/app/trade/GNOT-USD" },
];

export function GnotTape() {
  const [market, setMarket] = useState<Market | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancel = false;
    fetch("/api/gnot-market")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("market"))))
      .then((body: Market) => {
        if (!cancel && body.ok) setMarket(body);
      })
      .catch(() => {
        if (!cancel) setFailed(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const kucoin = market?.exchanges.find((item) => item.name === "KuCoin");

  return (
    <section className="tape" aria-label="GNOT spot markets">
      <div className="tape-copy">
        <p className="tape-kicker">GNOT spot</p>
        <p className="tape-price">
          {kucoin?.price != null ? money(kucoin.price) : "—"}
          {kucoin?.change != null ? (
            <span className={kucoin.change < 0 ? "down" : "up"}>{signedPercent(kucoin.change)}</span>
          ) : null}
        </p>
        <p className="tape-meta">
          {kucoin?.volumeQuote != null ? `24h ${compactUsd(kucoin.volumeQuote)} on KuCoin` : "KuCoin GNOT/USDT"}
          {failed ? " · price unavailable" : ""}
        </p>
        <div className="tape-links">
          {(market?.exchanges ?? LINKS.map((item) => ({ ...item, price: null, change: null, volumeQuote: null }))).map((item) => (
            <a key={item.name} href={item.href} target="_blank" rel="noreferrer">
              <strong>{item.name}</strong>
              <span>{item.pair}</span>
              {item.price != null ? <em>{money(item.price)}</em> : null}
            </a>
          ))}
        </div>
      </div>
      {market ? <Spark points={market.chart.points} /> : <div className="spark spark-empty" aria-hidden />}
    </section>
  );
}

function Spark({ points }: { points: Point[] }) {
  const width = 280;
  const height = 72;
  const lineH = 48;
  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;
  const maxVol = Math.max(...points.map((point) => point.volume), 1);
  const step = width / Math.max(points.length - 1, 1);
  const line = points
    .map((point, index) => {
      const x = index * step;
      const y = lineH - ((point.close - min) / span) * (lineH - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const barW = Math.max(1.5, width / points.length - 1);

  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="KuCoin GNOT/USDT hourly chart">
      {points.map((point, index) => {
        const barH = (point.volume / maxVol) * 16;
        return (
          <rect
            key={point.t}
            x={index * (width / points.length)}
            y={height - barH}
            width={barW}
            height={barH}
            fill={point.up ? "rgba(62,224,143,0.55)" : "rgba(255,107,129,0.55)"}
          />
        );
      })}
      <polyline fill="none" stroke="#3ee08f" strokeWidth="1.6" points={line} />
    </svg>
  );
}

function money(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function signedPercent(rate: number): string {
  const pct = rate * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function compactUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return money(value);
}
