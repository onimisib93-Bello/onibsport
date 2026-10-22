import { NextRequest, NextResponse } from "next/server";
import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { MAX_VIDEO_BYTES, VIDEO_TYPES } from "@/lib/videos";

/**
 * Lets the admin's browser upload a video straight to Vercel Blob, so large
 * files never pass through this server (which caps request bodies at a few MB).
 * Works with either Blob setup: a BLOB_READ_WRITE_TOKEN, or a connected store
 * (BLOB_STORE_ID) authenticated with the deployment's OIDC token.
 */
export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return NextResponse.json(
      { error: "Video uploads need Vercel Blob storage connected to this project. You can paste a YouTube link instead." },
      { status: 501 }
    );
  }

  const body = (await request.json().catch(() => null)) as HandleUploadPresignedBody | null;
  if (!body) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!/^videos\/[\w.-]+$/.test(pathname)) throw new Error("Uploads must go in the videos folder.");
        const token = await issueSignedToken({
          pathname,
          operations: ["put"],
          allowedContentTypes: VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_BYTES,
          validUntil: Date.now() + 60 * 60 * 1000,
        });
        return { token, urlOptions: { allowedContentTypes: VIDEO_TYPES, maximumSizeInBytes: MAX_VIDEO_BYTES } };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `The upload couldn't start: ${detail}` }, { status: 400 });
  }
}
