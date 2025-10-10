// pages/api/firebase.ts
import type { NextApiRequest, NextApiResponse } from "next";
import * as admin from "firebase-admin";
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";

/* -------------------------------------------------------------------------- */
/*                               FIREBASE ADMIN                               */
/* -------------------------------------------------------------------------- */
if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin credentials in environment variables.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
  });
}

const db = admin.firestore();

/* -------------------------------------------------------------------------- */
/*                              CLOUDFLARE R2 SETUP                           */
/* -------------------------------------------------------------------------- */
const r2BucketName = process.env.R2_BUCKET_NAME!;
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

function parseDataUrlToBuffer(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL format");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { mimeType, buffer };
}

async function uploadPermanentAssetToR2(folder: string, id: string, dataUrl: string): Promise<string> {
  const { mimeType, buffer } = parseDataUrlToBuffer(dataUrl);
  const key = `${folder}/${id}/preview`;

  const params: PutObjectCommandInput = {
    Bucket: r2BucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(params));
  const base = process.env.R2_PUBLIC_BASE_URL!;
  return `${base.replace(/\/$/, "")}/${key}`;
}

async function uploadTemporaryImageToR2(folder: string, dataUrl: string): Promise<string> {
  const { mimeType, buffer } = parseDataUrlToBuffer(dataUrl);
  const extension = mimeType.split('/')[1] || 'png';
  const name = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const key = `${folder}/${name}.${extension}`;

  const params: PutObjectCommandInput = {
      Bucket: r2BucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(params));
  const base = process.env.R2_PUBLIC_BASE_URL!;
  return `${base.replace(/\/$/, "")}/${key}`;
}

/* -------------------------------------------------------------------------- */
/*                                API HANDLER                                 */
/* -------------------------------------------------------------------------- */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      /* ------------------------------ FILTERS ------------------------------ */
      case "getFilters": {
        const snapshot = await db.collection("filters").get();
        const filters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }
      case "saveFilter": {
        const { filter } = req.body;
        if (!filter) return res.status(400).json({ error: "Missing filter data" });

        const docRef = db.collection("filters").doc();
        let previewImageUrl = filter.previewImageUrl;

        if (typeof previewImageUrl === "string" && previewImageUrl.startsWith("data:")) {
          previewImageUrl = await uploadPermanentAssetToR2("filters", docRef.id, previewImageUrl);
        }

        await docRef.set({
          ...filter,
          previewImageUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newFilter = { id: docRef.id, ...(await docRef.get()).data() };
        return res.status(200).json({ filter: newFilter });
      }
      case "updateFilter": {
        const { filterId, filterData } = req.body;
        if (!filterId || !filterData) return res.status(400).json({ error: "Missing filterId or filterData" });

        const docRef = db.collection("filters").doc(filterId);
        const updatedData = { ...filterData };

        if (typeof updatedData.previewImageUrl === "string" && updatedData.previewImageUrl.startsWith("data:")) {
          updatedData.previewImageUrl = await uploadPermanentAssetToR2("filters", filterId, updatedData.previewImageUrl);
        }

        await docRef.update(updatedData);
        const updatedFilter = { id: filterId, ...(await docRef.get()).data() };
        return res.status(200).json({ filter: updatedFilter });
      }
      case "deleteFilter": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });
        await db.collection("filters").doc(filterId).delete();
        return res.status(200).json({ success: true });
      }
      case "incrementFilterAccessCount": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });
        await db.collection("filters").doc(filterId).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ OUTFITS ------------------------------ */
      case "getOutfits": {
        const snapshot = await db.collection("outfits").get();
        const outfits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ outfits });
      }
      case "saveOutfit": {
        const { outfit } = req.body;
        if (!outfit) return res.status(400).json({ error: "Missing outfit data" });

        const docRef = db.collection("outfits").doc();
        let previewImageUrl = outfit.previewImageUrl;

        if (typeof previewImageUrl === "string" && previewImageUrl.startsWith("data:")) {
          previewImageUrl = await uploadPermanentAssetToR2("outfits", docRef.id, previewImageUrl);
        }

        await docRef.set({
          ...outfit,
          previewImageUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          accessCount: 0,
        });

        const newOutfit = { id: docRef.id, ...(await docRef.get()).data() };
        return res.status(200).json({ outfit: newOutfit });
      }
      case "incrementOutfitAccessCount": {
        const { outfitId } = req.body;
        if (!outfitId) return res.status(400).json({ error: "Missing outfitId" });
        await db.collection("outfits").doc(outfitId).update({ accessCount: admin.firestore.FieldValue.increment(1) });
        return res.status(200).json({ success: true });
      }

      /* ------------------------ TRANSIENT & SAVED IMAGES ----------------------- */
      case "storeFilteredImage": {
        const { image } = req.body;
        if (!image || !image.startsWith("data:")) {
          return res.status(400).json({ error: "Missing image data" });
        }
        const imageUrl = await uploadTemporaryImageToR2("filtered", image);
        return res.status(200).json({ imageUrl });
      }
      case "saveCreation": {
        const { creation } = req.body;
        if (!creation) return res.status(400).json({ error: "Missing creation data" });

        const docRef = db.collection("saved").doc();
        let previewImageUrl = creation.previewImageUrl;

        // Note: Here, we expect the URL from the 'filtered' folder, but for consistency in making it a permanent 'saved' asset, we re-upload it.
        if (typeof previewImageUrl === "string" && previewImageUrl.startsWith("data:")) {
          previewImageUrl = await uploadPermanentAssetToR2("saved", docRef.id, previewImageUrl);
        }
        
        await docRef.set({
          ...creation,
          previewImageUrl,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        const newCreation = { id: docRef.id, ...await (await docRef.get()).data(), previewImageUrl };
        return res.status(200).json({ creation: newCreation });
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err: unknown) {
    console.error("Firebase API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
