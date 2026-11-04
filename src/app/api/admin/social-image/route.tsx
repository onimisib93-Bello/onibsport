import { NextRequest } from "next/server";
import { renderShareCard } from "@/lib/shareCard";
import { parseFocus } from "@/lib/focus";

/**
 * The editor's share image download: the branded card for any photo and
 * social headline, in portrait (Facebook + Instagram, TikTok photo posts) or
 * landscape (link previews). See lib/shareCard.tsx for the design.
 *
 * GET /api/admin/social-image?image=<photo>&text=<headline>[&focus=x,y][&shape=landscape][&download=1]
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const shape = params.get("shape") === "landscape" ? "landscape" : "portrait";
  const image = await renderShareCard({
    origin: request.nextUrl.origin,
    image: params.get("image"),
    text: params.get("text") ?? "",
    focus: parseFocus(params.get("focus")),
    shape,
  });

  const headers = new Headers(image.headers);
  headers.set("Cache-Control", "private, no-store");
  if (params.get("download")) headers.set("Content-Disposition", `attachment; filename="onibsport-${shape}.png"`);
  return new Response(image.body, { status: image.status, headers });
}
