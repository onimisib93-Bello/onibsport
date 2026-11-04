import { ImageResponse } from "next/og";

/**
 * Onibsport's branded share card, drawn as a PNG. One design in two shapes:
 *
 * - "portrait" 1080 × 1350 (4:5) for Facebook + Instagram and TikTok photo
 *   posts: the tallest shape Instagram and Facebook show at full size. On
 *   TikTok it sits between thin bars, so the text stays clear of the
 *   right-hand buttons and the caption at the bottom.
 * - "landscape" 1200 × 630 for link previews on Facebook, X, WhatsApp and
 *   LinkedIn, which crop shared links to this shape.
 *
 * Used by /api/admin/social-image (downloads in the editor) and /og/[slug]
 * (every story's link-preview image).
 */

export type ShareCardShape = "portrait" | "landscape";

export const SHARE_CARD_SIZES: Record<ShareCardShape, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1200, height: 630 },
};

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

/** Shorter text gets bigger letters. */
function textSize(text: string, shape: ShareCardShape) {
  const steps = shape === "portrait" ? [132, 112, 94, 80] : [84, 72, 62, 54];
  if (text.length <= 22) return steps[0];
  if (text.length <= 40) return steps[1];
  if (text.length <= 60) return steps[2];
  return steps[3];
}

function Brand({ logo, size }: { logo: string | null; size: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
        <img src={logo} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: "contain", marginRight: Math.round(size * 0.22) }} />
      )}
      <div style={{ display: "flex", fontFamily: "Display", fontSize: Math.round(size * 0.64), color: "#ffffff", letterSpacing: 1 }}>
        ONIB<span style={{ color: ORANGE }}>SPORT</span>
      </div>
    </div>
  );
}

function Tag({ tag, size }: { tag: string; size: number }) {
  return (
    <div
      style={{
        display: "flex",
        background: ORANGE,
        color: NIGHT,
        fontSize: size,
        padding: `${Math.round(size / 3)}px ${Math.round(size * 0.75)}px`,
        borderRadius: 999,
        textTransform: "uppercase",
        letterSpacing: 1,
      }}
    >
      {tag}
    </div>
  );
}

export async function renderShareCard({
  origin,
  image,
  text,
  tag,
  shape,
  headers,
}: {
  origin: string;
  image?: string | null;
  text: string;
  tag?: string | null;
  shape: ShareCardShape;
  headers?: Record<string, string>;
}): Promise<ImageResponse> {
  const { width, height } = SHARE_CARD_SIZES[shape];
  const copy = text.trim().slice(0, shape === "portrait" ? 90 : 110) || "You need to see this";
  const label = (tag ?? "").trim().slice(0, 30);

  const [photo, logo, display, body] = await Promise.all([
    image ? loadImage(image, origin) : Promise.resolve(null),
    loadImage("/logo.png", origin),
    googleFont("Big Shoulders", 900),
    googleFont("Archivo", 800),
  ]);
  const fonts = [
    ...(display ? [{ name: "Display", data: display, weight: 900 as const, style: "normal" as const }] : []),
    ...(body ? [{ name: "Body", data: body, weight: 800 as const, style: "normal" as const }] : []),
  ];

  const photoLayer = photo && (
    // eslint-disable-next-line @next/next/no-img-element -- rendered into a PNG, not a web page
    <img src={photo} alt="" width={width} height={height} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover", objectPosition: "50% 30%" }} />
  );

  const portrait = (
    <div style={{ width, height, display: "flex", position: "relative", background: NIGHT, fontFamily: "Body" }}>
      {photoLayer}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          display: "flex",
          backgroundImage: `linear-gradient(180deg, rgba(18,10,51,0.55) 0%, rgba(18,10,51,0) 22%, rgba(18,10,51,0.1) 32%, rgba(18,10,51,0.9) 60%, ${NIGHT} 100%)`,
        }}
      />
      <div style={{ position: "absolute", top: 56, left: 64, display: "flex" }}>
        <Brand logo={logo} size={84} />
      </div>
      {/* Clear of TikTok's buttons on the right and its caption at the bottom. */}
      <div style={{ position: "absolute", left: 72, right: 170, bottom: 250, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        {label && (
          <div style={{ display: "flex", marginBottom: 28 }}>
            <Tag tag={label} size={30} />
          </div>
        )}
        <div style={{ display: "flex", fontFamily: "Display", fontSize: textSize(copy, shape), lineHeight: 0.95, color: "#ffffff", textTransform: "uppercase" }}>{copy}</div>
        <div style={{ display: "flex", width: 140, height: 12, background: ORANGE, borderRadius: 6, marginTop: 34 }} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width,
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
  );

  const landscape = (
    <div style={{ width, height, display: "flex", position: "relative", background: NIGHT, fontFamily: "Body" }}>
      {photoLayer}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width,
          height,
          display: "flex",
          backgroundImage: `linear-gradient(90deg, ${NIGHT} 0%, rgba(18,10,51,0.92) 40%, rgba(18,10,51,0.45) 68%, rgba(18,10,51,0.1) 100%)`,
        }}
      />
      <div style={{ position: "absolute", top: 44, left: 56, display: "flex" }}>
        <Brand logo={logo} size={60} />
      </div>
      <div style={{ position: "absolute", left: 56, top: 150, width: 700, bottom: 104, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
        {label && (
          <div style={{ display: "flex", marginBottom: 20 }}>
            <Tag tag={label} size={22} />
          </div>
        )}
        <div style={{ display: "flex", fontFamily: "Display", fontSize: textSize(copy, shape), lineHeight: 0.98, color: "#ffffff", textTransform: "uppercase" }}>{copy}</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width,
          height: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px",
          background: ORANGE,
          color: NIGHT,
        }}
      >
        <div style={{ display: "flex", fontFamily: "Display", fontSize: 38, letterSpacing: 1 }}>READ THE FULL STORY</div>
        <div style={{ display: "flex", fontSize: 24 }}>ONIBSPORT</div>
      </div>
    </div>
  );

  return new ImageResponse(shape === "portrait" ? portrait : landscape, { width, height, fonts: fonts.length ? fonts : undefined, headers });
}
