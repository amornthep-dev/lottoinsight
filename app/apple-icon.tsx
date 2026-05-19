import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0F1117",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          gap: 4,
        }}
      >
        {/* Ball emoji */}
        <div style={{ fontSize: 80, lineHeight: 1, display: "flex" }}>🎱</div>
        {/* "LI" text */}
        <div style={{
          fontSize: 26, fontWeight: 900,
          color: "#C9A84C", fontFamily: "sans-serif",
          letterSpacing: "0.05em", display: "flex",
        }}>
          LottoInsight
        </div>
      </div>
    ),
    { ...size }
  );
}
