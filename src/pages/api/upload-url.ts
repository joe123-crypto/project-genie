// pages/api/upload-url.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,//`https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { contentType, folder = "temp" } = req.body as { contentType?: string; folder?: string };

    if (!contentType) {
      return res.status(400).json({ error: "Missing contentType" });
    }

    // Sanitize folder name
    const safeFolder = folder.replace(/[^a-zA-Z0-9-_]/g, "") || "temp";

    // Unique filename
    const key = `${safeFolder}/${uuidv4()}`;

    // Create the signed PUT URL
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    console.log(uploadUrl);
    const fileUrl = `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}`;

    return res.status(200).json({ uploadUrl, fileUrl });
  } catch (err: unknown) {
    console.error("❌ Error creating signed URL:", err);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
}
