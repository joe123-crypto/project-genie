
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeFirebaseAdmin } from "../../lib/firebaseAdmin";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const app = initializeFirebaseAdmin();
    const db = app.firestore();
    const auth = app.auth();
    const postsCollection = db.collection("posts");
    const snapshot = await postsCollection.orderBy("createdAt", "desc").limit(50).get();

    if (snapshot.empty) {
      return res.status(200).json([]);
    }

    const feedPromises = snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let author = null;

        if (data.userId) {
            try {
                const userRecord = await auth.getUser(data.userId);
                if (userRecord.email) {
                    const userQuery = await db.collection('users').where('email', '==', userRecord.email).limit(1).get();
                    if (!userQuery.empty) {
                        const userDoc = userQuery.docs[0].data();
                        author = {
                            displayName: userDoc.displayName || userRecord.displayName || null,
                            photoURL: userDoc.photoURL || userRecord.photoURL || null
                        };
                    } else {
                      author = {
                        displayName: userRecord.displayName || null,
                        photoURL: userRecord.photoURL || null
                      };
                    }
                }
            } catch (error) {
                console.error(`Error fetching user data for userId: ${data.userId}`, error);
            }
        }

        return {
          id: doc.id,
          userId: data.userId,
          filterId: data.filterId,
          filterName: data.filterName || '',
          imageUrl: data.imageUrl,
          likes: data.likes || [],
          likeCount: data.likeCount || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          author: author
        };
      });

    const feed = await Promise.all(feedPromises);

    res.status(200).json(feed);
  } catch (error) {
    console.error("Error fetching public feed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
