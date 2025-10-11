import type { NextApiRequest, NextApiResponse } from "next";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { Agent } from "https";
import { v4 as uuidv4 } from 'uuid';

const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestHandler: new NodeHttpHandler({
        httpsAgent: new Agent({
            // @ts-ignore
            secureProtocol: "TLSv1_2_method",
        }),
    }),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { filename, image, destination } = req.body as {
    filename?: string;
    image?: string;
    destination?: 'saved' | 'filters' | 'outfits';
  };

  const bucket = process.env.R2_BUCKET_NAME!;
  console.log("Received destination:", destination);

  try {
    if (destination === 'saved') {
      if (!filename || !filename.startsWith("filtered/")) {
        return res.status(400).json({ error: "Invalid request for saving an image." });
      }

      const newKey = filename.replace(/^filtered\//, "saved/");
      console.log("Saving to saved. New key:", newKey);

      await r2.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${filename}`,
          Key: newKey,
        })
      );
      await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: filename }));

      const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${newKey}`;
      return res.status(200).json({ url: publicUrl });

    } else if (destination === 'filters' || destination === 'outfits') {
      if (!image || !image.startsWith('data:image')) {
        return res.status(400).json({ error: "Invalid request for creating a filter or outfit image." });
      }
      
      const newKey = `${destination}/${uuidv4()}.png`;
      console.log("Saving to filters or outfits. New key:", newKey);
      const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');

      await r2.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: newKey,
            Body: buffer,
            ContentType: 'image/png',
        })
      );

      const publicUrl = `${process.env.R2_PUBLIC_BASE_URL}/${newKey}`;
      return res.status(200).json({ url: publicUrl });

    } else {
      console.log("Invalid destination received:", destination);
      return res.status(400).json({ error: "Invalid destination." });
    }
  } catch (err: any) {
    console.error("Error in save-image API:", err);
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
