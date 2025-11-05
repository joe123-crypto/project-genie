
import type { NextApiRequest, NextApiResponse } from "next";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@aws-sdk/node-http-handler";
import { Agent } from "https";
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebaseAdmin, verifyIdToken } from "../../lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

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

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.error('No authorization token provided.');
      return res.status(401).json({ error: "Unauthorized", details: "No token provided." });
    }
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;

    const { 
        image, 
        destination,
        generationId,
        prompt,
        negativePrompt,
        numInferenceSteps,
        guidanceScale,
        strength,
        lora,
    } = req.body as {
        image?: string;
        destination?: 'saved' | 'filters' | 'outfits';
        generationId?: string;
        prompt?: string;
        negativePrompt?: string;
        numInferenceSteps?: number;
        guidanceScale?: number;
        strength?: number;
        lora?: string;
    };

    const bucket = process.env.R2_BUCKET_NAME!;

    if (destination === 'saved' || destination === 'filters' || destination === 'outfits') {
      if (!image || !image.startsWith('data:image')) {
        return res.status(400).json({ error: "Invalid request for creating an image." });
      }
      
      const newKey = `${destination}/${uuidv4()}.png`;
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

      initializeFirebaseAdmin();
      const db = getFirestore();
      const savedImageRef = db.collection('savedImages').doc();
      const imageData: any = {
        userId,
        url: publicUrl,
        createdAt: new Date(),
      };
      if (generationId) imageData.generationId = generationId;
      if (prompt) imageData.prompt = prompt;
      if (negativePrompt) imageData.negativePrompt = negativePrompt;
      if (numInferenceSteps) imageData.numInferenceSteps = numInferenceSteps;
      if (guidanceScale) imageData.guidanceScale = guidanceScale;
      if (strength) imageData.strength = strength;
      if (lora) imageData.lora = lora;

      await savedImageRef.set(imageData);

      return res.status(200).json({ url: publicUrl });

    } else {
      console.log("Invalid destination received:", destination);
      return res.status(400).json({ error: "Invalid destination." });
    }
  } catch (err: any) {
    console.error("Error in save-image API:", err);
    if (err.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: "Unauthorized", details: "Token expired" });
    }
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}
