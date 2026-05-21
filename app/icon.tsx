import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#120820",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
        }}
      >
        {/* Gold "L" lettermark */}
        <div style={{
          fontSize: 22,
          fontWeight: 900,
          color: "#A855F7",
          fontFamily: "serif",
          display: "flex",
          letterSpacing: "-0.05em",
        }}>
          L
        </div>
      </div>
    ),
    { ...size }
  );
}
