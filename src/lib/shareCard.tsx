import { ImageResponse } from "next/og";

/**
 * Onibsport's share card, drawn as a PNG, matching the house template: the
 * photo fills the frame and fades to near-black at the bottom, the logo sits
 * top-left, and a huge white headline sits centred in the lower third with an
 * orange "LINK IN BIO FOR MORE" line under it (the bio link is the /links hub).
 *
 * One design in two shapes:
 * - "portrait" 1080 × 1350 (4:5) for Facebook + Instagram and TikTok photo
 *   posts: the tallest shape Instagram and Facebook show at full size.
 * - "landscape" 1200 × 630 for link previews on Facebook, X, WhatsApp and
 *   LinkedIn, which crop shared links to this shape.
 *
 * The text is the social headline (a teaser that makes people click), not the
 * article's own title. Used by /api/admin/social-image (downloads in the
 * editor) and /og/[slug] (every story's link-preview image).
 */

export type ShareCardShape = "portrait" | "landscape";

export const SHARE_CARD_SIZES: Record<ShareCardShape, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1200, height: 630 },
};

const ORANGE = "#f7941d";
const INK = "#07060d";

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
async function loadImage(src: string, origin: string): Promise<string | null> {
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

/** Shorter headlines get bigger letters. */
function textSize(text: string, shape: ShareCardShape) {
  const steps = shape === "portrait" ? [156, 132, 112, 96] : [96, 82, 70, 60];
  if (text.length <= 20) return steps[0];
  if (text.length <= 34) return steps[1];
  if (text.length <= 55) return steps[2];
  return steps[3];
}

/** Where the photo is anchored when it's cropped, as "x% y%" (defaults to a little above centre, where faces usually are). */
function position(focus?: { x: number; y: number } | null) {
  if (!focus) return "50% 30%";
  const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));
  return `${clamp(focus.x)}% ${clamp(focus.y)}%`;
}

export async function renderShareCard({
  origin,
  image,
  text,
  shape,
  focus,
  headers,
}: {
  origin: string;
  image?: string | null;
  text: string;
  shape: ShareCardShape;
  /** The photo's focal point in percent (see the editor's focal-point picker). */
  focus?: { x: number; y: number } | null;
  headers?: Record<string, string>;
}): Promise<ImageResponse> {
  const { width, height } = SHARE_CARD_SIZES[shape];
  const portrait = shape === "portrait";
  const copy = text.trim().replace(/\s+/g, " ").slice(0, portrait ? 80 : 90) || "You need to see this";

  const [photo, logo, display, body] = await Promise.all([
    image ? loadImage(image, origin) : Promise.resolve(null),
    loadImage("/logo.png", origin),
    googleFont("Anton", 400),
    googleFont("Barlow Condensed", 600),
  ]);
  const fonts = [
    ...(display ? [{ name: "Display", data: display, weight: 400 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Body", data: body, weight: 600 as const, style: "normal" as const }] : []),
  ];

  // Sizes for each shape: logo width, side padding, gap above the bottom, orange line size.
  const s = portrait
    ? { logo: 150, pad: 60, bottom: 96, cta: 46, gap: 26, fade: "38%" }
    : { logo: 96, pad: 56, bottom: 40, cta: 30, gap: 14, fade: "30%" };
  const logoHeight = Math.round((s.logo * 514) / 586);

  return new ImageResponse(
    (
      <div style={{ width, height, display: "flex", position: "relative", background: INK, fontFamily: "Body" }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
          <img src={photo} alt="" width={width} height={height} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover", objectPosition: position(focus) }} />
        )}
        {/* A light shade at the top for the logo, then a deep fade to near-black behind the headline. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width,
            height,
            display: "flex",
            backgroundImage: `linear-gradient(180deg, rgba(7,6,13,0.35) 0%, rgba(7,6,13,0) 16%, rgba(7,6,13,0) ${s.fade}, rgba(7,6,13,0.72) 62%, rgba(7,6,13,0.96) 80%, ${INK} 100%)`,
          }}
        />
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
          <img src={logo} alt="" width={s.logo} height={logoHeight} style={{ position: "absolute", top: portrait ? 44 : 28, left: portrait ? 48 : 36, width: s.logo, height: logoHeight, objectFit: "contain" }} />
        )}
        <div
          style={{
            position: "absolute",
            left: s.pad,
            right: s.pad,
            bottom: s.bottom,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              textAlign: "center",
              fontFamily: "Display",
              fontSize: textSize(copy, shape),
              lineHeight: 1.02,
              color: "#ffffff",
              textTransform: "uppercase",
              textShadow: "0 4px 24px rgba(0,0,0,0.45)",
            }}
          >
            {copy}
          </div>
          <div style={{ display: "flex", marginTop: s.gap, fontSize: s.cta, color: ORANGE, letterSpacing: 2, textTransform: "uppercase" }}>
            {/* On a post readers go through the bio link (the /links hub); a link preview is the link itself. */}
            {portrait ? "Link in bio for more" : "Tap to read the full story"}
          </div>
        </div>
      </div>
    ),
    { width, height, fonts: fonts.length ? fonts : undefined, headers }
  );
}
