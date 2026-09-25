import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const alt = SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0c",
          color: "#e4e4e7",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#3ee08f", fontSize: 28, letterSpacing: 3 }}>
          <div style={{ width: 18, height: 18, borderRadius: 99, background: "#3ee08f" }} />
          GNO.LAND MAINNET · GNOLAND-1
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -2, lineHeight: 1 }}>{SITE_NAME}</div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: "#a1a1aa", maxWidth: 920 }}>{SITE_DESCRIPTION}</div>
        </div>
        <div style={{ fontSize: 24, color: "#71717a" }}>gnoland-ecosystem.vercel.app</div>
      </div>
    ),
    { ...size },
  );
}
