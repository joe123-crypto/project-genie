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
  region: "auto", // R2 always uses 'auto' region
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

/**
 * Converts a base64 data URL → { mimeType, Buffer }.
 * Example input: data:image/png;base64,iVBORw0...
 */
function parseDataUrlToBuffer(dataUrl: string): { mimeType: string; buffer: Buffer } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL format");
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], "base64");
  return { mimeType, buffer };
}

/**
 * Uploads an image (in base64) to R2 under a folder/id/preview key
 * and returns a publicly accessible URL.
 */
async function uploadPreviewToR2(folder: string, id: string, dataUrl: string): Promise<string> {
  const { mimeType, buffer } = parseDataUrlToBuffer(dataUrl);
  const key = `${folder}/${id}/preview`;

  const params: PutObjectCommandInput = {
    Bucket: r2BucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  await r2Client.send(new PutObjectCommand(params));

  // Return a public-facing URL based on your configured base
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
      /* ------------------------------ GET FILTERS ------------------------------ */
      case "getFilters": {
        const snapshot = await db.collection("filters").get();
        const filters = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ filters });
      }

      /* ------------------------------ SAVE FILTER ------------------------------ */
      case "saveFilter": {
        const { filter } = req.body;
        if (!filter) return res.status(400).json({ error: "Missing filter data" });

        const docRef = db.collection("filters").doc();
        let previewImageUrl = filter.previewImageUrl;

        // Upload base64 image to R2 → return public URL
        if (typeof previewImageUrl === "string" && previewImageUrl.startsWith("data:")) {
          previewImageUrl = await uploadPreviewToR2("filters", docRef.id, previewImageUrl);
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

      /* ------------------------------ SAVE OUTFIT ------------------------------ */
      case "saveOutfit": {
        const { outfit } = req.body;
        if (!outfit) return res.status(400).json({ error: "Missing outfit data" });

        const docRef = db.collection("outfits").doc();
        let previewImageUrl = outfit.previewImageUrl;

        // Upload to R2 under "outfits/{id}/preview"
        if (typeof previewImageUrl === "string" && previewImageUrl.startsWith("data:")) {
          previewImageUrl = await uploadPreviewToR2("outfits", docRef.id, previewImageUrl);
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

      /* ----------------------------- UPDATE FILTER ----------------------------- */
      case "updateFilter": {
        const { filterId, filterData } = req.body;
        if (!filterId || !filterData)
          return res.status(400).json({ error: "Missing filterId or filterData" });

        const docRef = db.collection("filters").doc(filterId);
        const updatedData = { ...filterData };

        // Replace base64 image with uploaded one
        if (
          typeof updatedData.previewImageUrl === "string" &&
          updatedData.previewImageUrl.startsWith("data:")
        ) {
          updatedData.previewImageUrl = await uploadPreviewToR2(
            "filters",
            filterId,
            updatedData.previewImageUrl
          );
        }

        await docRef.update(updatedData);
        const updatedFilter = { id: filterId, ...(await docRef.get()).data() };
        return res.status(200).json({ filter: updatedFilter });
      }

      /* ------------------------------ DELETE FILTER ----------------------------- */
      case "deleteFilter": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });

        await db.collection("filters").doc(filterId).delete();
        return res.status(200).json({ success: true });
      }

      /* ------------------------ INCREMENT FILTER ACCESS ------------------------ */
      case "incrementAccessCount": {
        const { filterId } = req.body;
        if (!filterId) return res.status(400).json({ error: "Missing filterId" });

        await db.collection("filters").doc(filterId).update({
          accessCount: admin.firestore.FieldValue.increment(1),
        });
        return res.status(200).json({ success: true });
      }

      /* ------------------------------ GET OUTFITS ------------------------------ */
      case "getOutfits": {
        const snapshot = await db.collection("outfits").get();
        const outfits = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return res.status(200).json({ outfits });
      }

      /* ----------------------- INCREMENT OUTFIT ACCESS ------------------------- */
      case "incrementOutfitAccessCount": {
        const { outfitId } = req.body;
        if (!outfitId) return res.status(400).json({ error: "Missing outfitId" });

        await db.collection("outfits").doc(outfitId).update({
          accessCount: admin.firestore.FieldValue.increment(1),
        });
        return res.status(200).json({ success: true });
      }

      /* -------------------------------- DEFAULT -------------------------------- */
      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (err: unknown) {
    console.error("Firebase API error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
  }
}
