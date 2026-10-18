import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Vercel Blob can authenticate two ways: the older BLOB_READ_WRITE_TOKEN, or
 * a connected store (BLOB_STORE_ID) plus the OIDC token Vercel provides to
 * every deployment. Stores connected recently only get the second kind.
 */
function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

export async function POST(request: NextRequest) {
  if (!blobConfigured()) {
    return NextResponse.json(
      {
        error:
          "Image uploads aren't connected here. In Vercel, open Storage, connect a Blob store to this project, and make sure its variables are enabled for this environment; then redeploy (or run `vercel env pull` for local development). Until then, paste an image URL or an existing /placeholders path instead.",
      },
      { status: 501 }
    );
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Use JPG, PNG, WEBP, GIF or AVIF." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (8MB max)." }, { status: 400 });
  }

  try {
    const blob = await put(`articles/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `The upload didn't go through: ${detail}. Try again, or paste an image URL instead.` },
      { status: 502 }
    );
  }
}
