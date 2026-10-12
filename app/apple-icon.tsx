import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#ff5d8f" }}>
        <div style={{ width: 86, height: 104, borderRadius: "50% 50% 48% 48% / 55% 55% 45% 45%", background: "#ffc93c", display: "flex", alignItems: "center", justifyContent: "center", color: "#2b2350", fontSize: 68, fontWeight: 800 }}>
          A
        </div>
      </div>
    ),
    size,
  );
}
