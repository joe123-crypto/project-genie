import type { NextApiRequest, NextApiResponse } from "next";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Create the R2 client using environment variables
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename } = req.body as { filename?: string };

    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }

    // Enforce directory change
    if (!filename.startsWith("filtered/")) {
      return res.status(400).json({ error: "Filename must be under filtered/" });
    }

    const bucket = process.env.R2_BUCKET_NAME!;
    const newKey = filename.replace(/^filtered\//, "saved/");

    // Copy the object to the new location
    await r2.send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${filename}`, // old key
        Key: newKey, // new key
      })
    );

    // Delete the old object
    await r2.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: filename,
      })
    );

    // Construct a public URL (assuming bucket is public)
    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${newKey}`;

    return res.status(200).json({ url: publicUrl });
  } catch (err: any) {
    console.error("Error moving file:", err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
