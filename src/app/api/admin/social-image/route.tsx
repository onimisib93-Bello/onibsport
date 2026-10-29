import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";

/**
 * The one share image for Facebook + Instagram and TikTok photo posts:
 * 1080 × 1350 (4:5 portrait), the tallest shape Instagram and Facebook show
 * at full size in the feed. On TikTok it sits between thin bars, so the text
 * stays clear of the right-hand buttons and the caption at the bottom.
 *
 * GET /api/admin/social-image?image=<photo>&text=<teaser>&tag=<league>[&download=1]
 */

const WIDTH = 1080;
const HEIGHT = 1350;
const NIGHT = "#120a33";
const ORANGE = "#f7941d";

/** Google Fonts as TrueType (the image renderer can't read woff2), cached for the life of the server. */
const fontCache = new Map<string, Promise<ArrayBuffer | null>>();
function googleFont(family: string, weight: number) {
  const key = `${family}:${weight}`;
  if (!fontCache.has(key)) {
    fontCache.set(
      key,
      (async () => {
        try {
          const css = await fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`, {
            // A non-browser user agent makes Google serve TrueType rather than woff2.
            headers: { "User-Agent": "curl/8.0" },
          }).then((r) => r.text());
          const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
          return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
        } catch {
          return null;
        }
      })()
    );
  }
  return fontCache.get(key)!;
}

/** The photo as a data URL, or null if it can't be used (missing, too big, or a format the renderer can't draw). */
async function loadPhoto(src: string, origin: string): Promise<string | null> {
  try {
    const url = new URL(src, origin);
    if (url.protocol !== "https:" && url.origin !== origin) return null;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpe?g|png|gif)/.test(type)) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > 12 * 1024 * 1024) return null;
    return `data:${type.split(";")[0]};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Shorter teasers get bigger letters. */
function textSize(text: string) {
  if (text.length <= 22) return 132;
  if (text.length <= 40) return 112;
  if (text.length <= 60) return 94;
  return 80;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = request.nextUrl.origin;
  const text = (params.get("text") ?? "").trim().slice(0, 90) || "You need to see this";
  const tag = (params.get("tag") ?? "").trim().slice(0, 30);
  const imageParam = params.get("image") ?? "";

  const [photo, logo, display, body] = await Promise.all([
    imageParam ? loadPhoto(imageParam, origin) : Promise.resolve(null),
    loadPhoto("/logo.png", origin),
    googleFont("Big Shoulders", 900),
    googleFont("Archivo", 800),
  ]);
  const fonts = [
    ...(display ? [{ name: "Display", data: display, weight: 900 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Body", data: body, weight: 800 as const, style: "normal" as const }] : []),
  ];

  const image = new ImageResponse(
    (
      <div style={{ width: WIDTH, height: HEIGHT, display: "flex", position: "relative", background: NIGHT, fontFamily: "Body" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
          <img src={photo} alt="" width={WIDTH} height={HEIGHT} style={{ position: "absolute", top: 0, left: 0, width: WIDTH, height: HEIGHT, objectFit: "cover", objectPosition: "50% 30%" }} />
        )}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: WIDTH,
            height: HEIGHT,
            display: "flex",
            backgroundImage: `linear-gradient(180deg, rgba(18,10,51,0.55) 0%, rgba(18,10,51,0) 22%, rgba(18,10,51,0.1) 32%, rgba(18,10,51,0.9) 60%, ${NIGHT} 100%)`,
          }}
        />

        {/* Brand, top left. */}
        <div style={{ position: "absolute", top: 56, left: 64, display: "flex", alignItems: "center" }}>
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
            <img src={logo} alt="" width={84} height={84} style={{ width: 84, height: 84, objectFit: "contain", marginRight: 18 }} />
          )}
          <div style={{ display: "flex", fontFamily: "Display", fontSize: 54, color: "#ffffff", letterSpacing: 1 }}>
            ONIB<span style={{ color: ORANGE }}>SPORT</span>
          </div>
        </div>

        {/* Teaser: clear of TikTok's buttons on the right and its caption at the bottom. */}
        <div style={{ position: "absolute", left: 72, right: 170, bottom: 250, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          {tag && (
            <div
              style={{
                display: "flex",
                background: ORANGE,
                color: NIGHT,
                fontSize: 30,
                padding: "10px 22px",
                borderRadius: 999,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 28,
              }}
            >
              {tag}
            </div>
          )}
          <div style={{ display: "flex", fontFamily: "Display", fontSize: textSize(text), lineHeight: 0.95, color: "#ffffff", textTransform: "uppercase" }}>{text}</div>
          <div style={{ display: "flex", width: 140, height: 12, background: ORANGE, borderRadius: 6, marginTop: 34 }} />
        </div>

        {/* Call to action strip. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: WIDTH,
            height: 132,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 72px",
            background: ORANGE,
            color: NIGHT,
          }}
        >
          <div style={{ display: "flex", fontFamily: "Display", fontSize: 50, letterSpacing: 1 }}>FULL STORY</div>
          <div style={{ display: "flex", fontSize: 32 }}>LINK IN BIO</div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT, fonts: fonts.length ? fonts : undefined }
  );

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "private, no-store");
  if (params.get("download")) headers.set("Content-Disposition", 'attachment; filename="onibsport-share-image.png"');
  return new Response(image.body, { status: image.status, headers });
}
