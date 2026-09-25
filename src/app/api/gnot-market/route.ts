import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type Candle = { t: number; close: number; volume: number; up: boolean };

const KUCOIN = "https://www.kucoin.com/trade/GNOT-USDT";
const KRAKEN = "https://pro.kraken.com/app/trade/GNOT-USD";

export async function GET() {
  try {
    const [statsRes, candlesRes, krakenRes] = await Promise.all([
      fetch("https://api.kucoin.com/api/v1/market/stats?symbol=GNOT-USDT", { next: { revalidate: 60 } }),
      fetch("https://api.kucoin.com/api/v1/market/candles?type=1hour&symbol=GNOT-USDT", { next: { revalidate: 60 } }),
      fetch("https://api.kraken.com/0/public/Ticker?pair=GNOTUSD", { next: { revalidate: 60 } }),
    ]);
    if (!statsRes.ok || !candlesRes.ok) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    const stats = (await statsRes.json()) as {
      data?: { last?: string; changeRate?: string; volValue?: string };
    };
    const candles = (await candlesRes.json()) as { data?: string[][] };
    const rows = Array.isArray(candles.data) ? candles.data.slice(0, 48).reverse() : [];
    const points: Candle[] = rows
      .map((row) => {
        const open = Number(row[1]);
        const close = Number(row[2]);
        const volume = Number(row[5]);
        const t = Number(row[0]);
        if (!Number.isFinite(close) || !Number.isFinite(t)) return null;
        return { t, close, volume: Number.isFinite(volume) ? volume : 0, up: close >= open };
      })
      .filter((point): point is Candle => point !== null);

    let kraken: { price: number; change: number } | null = null;
    if (krakenRes.ok) {
      const body = (await krakenRes.json()) as { result?: Record<string, { c?: string[]; o?: string }> };
      const ticker = body.result ? Object.values(body.result)[0] : undefined;
      const price = Number(ticker?.c?.[0]);
      const open = Number(ticker?.o);
      if (Number.isFinite(price) && price > 0 && Number.isFinite(open) && open > 0) {
        kraken = { price, change: (price - open) / open };
      }
    }

    const price = Number(stats.data?.last);
    const change = Number(stats.data?.changeRate);
    const volumeQuote = Number(stats.data?.volValue);
    if (!Number.isFinite(price) || points.length < 2) {
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      exchanges: [
        {
          name: "KuCoin",
          pair: "GNOT/USDT",
          href: KUCOIN,
          price,
          change: Number.isFinite(change) ? change : 0,
          volumeQuote: Number.isFinite(volumeQuote) ? volumeQuote : 0,
        },
        kraken
          ? { name: "Kraken", pair: "GNOT/USD", href: KRAKEN, price: kraken.price, change: kraken.change, volumeQuote: null }
          : { name: "Kraken", pair: "GNOT/USD", href: KRAKEN, price: null, change: null, volumeQuote: null },
      ],
      chart: { source: "KuCoin", pair: "GNOT/USDT", points },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
