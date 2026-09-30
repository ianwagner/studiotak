import { ImageResponse } from "next/og";
import { getCanonicalUrl } from "@/lib/siteUrl";

export const alt = "Studio Tak Partners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function PartnersOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#181818"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 720,
            height: 260,
            border: "1px solid #353535",
            borderRadius: 36,
            background: "#202020"
          }}
        >
          <img
            src={getCanonicalUrl("/LOGO_EMAIL.png")}
            width="560"
            height="96"
            alt="Studio Tak"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    ),
    size
  );
}

