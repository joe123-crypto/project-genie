// pages/api/upload-url.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const r2 = new S3Client({
  region: "auto", // R2 requires "auto"
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    
    const { contentType } = req.body as { contentType?: string };
    if (!contentType) {
      return res.status(400).json({ error: "Missing contentType" });
    }
    // Unique key under temp/
    const key = `temp/${uuidv4()}`;

    // Create a signed URL valid for 5 minutes
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    //console.log(uploadUrl);
    const fileUrl = `${process.env.R2_PUBLIC_BASE_URL!.replace(/\/$/, "")}/${key}`;
    return res.status(200).json({ uploadUrl, fileUrl });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Error creating signed URL:", err);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
}
