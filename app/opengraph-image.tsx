import { ImageResponse } from "next/og";

export const alt = "LottoInsight — สถิติหวยไทย";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0a0c14",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Background: laptop photo ── */}
        <img
          src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=630&fit=crop&q=80"
          style={{
            position: "absolute",
            top: 0, left: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            opacity: 0.45,
          }}
        />

        {/* ── Gradient: left visible → right dark for text ── */}
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(105deg, rgba(10,12,20,0.15) 0%, rgba(10,12,20,0.6) 38%, rgba(10,12,20,0.96) 62%)",
          display: "flex",
        }} />

        {/* ── RIGHT — text (same layout, unchanged) ── */}
        <div style={{
          position: "absolute",
          top: 0, right: 0, bottom: 0,
          width: "60%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 72px",
          gap: 0,
        }}>
          {/* Eyebrow */}
          <div style={{
            fontSize: 13,
            color: "#C9A84C",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 16,
            display: "flex",
          }}>
            🎱 THAI LOTTERY STATISTICS
          </div>

          {/* ★ HERO — LottoInsight ★ */}
          <div style={{
            fontSize: 96,
            fontWeight: 900,
            color: "#C9A84C",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
            marginBottom: 16,
            display: "flex",
          }}>
            LottoInsight
          </div>

          {/* Thai subtitle */}
          <div style={{
            fontSize: 30,
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 24,
            display: "flex",
          }}>
            วิเคราะห์สถิติหวยไทย
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { t: "Phase 1·2·3",  c: "#34d399" },
              { t: "Triple Score", c: "#C9A84C" },
              { t: "Signal Conv.", c: "#a78bfa" },
            ].map(({ t, c }) => (
              <div key={t} style={{
                background: `${c}1a`,
                border: `1px solid ${c}50`,
                borderRadius: 999,
                padding: "6px 18px",
                fontSize: 16,
                color: c,
                fontWeight: 700,
                display: "flex",
              }}>
                {t}
              </div>
            ))}
          </div>

          {/* Domain */}
          <div style={{
            fontSize: 16,
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#22c55e", display: "flex",
            }} />
            lottoinsight-tau.vercel.app
          </div>
        </div>

        {/* ── Gold bottom accent ── */}
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: 3,
          background: "linear-gradient(to right, transparent 0%, #C9A84C 30%, #C9A84C 70%, transparent 100%)",
          display: "flex",
        }} />
      </div>
    ),
    { ...size }
  );
}
