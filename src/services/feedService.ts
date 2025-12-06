import { Share } from "../types";
import { getPosts, likePost, unlikePost } from "./firebaseService";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

/**
 * Fetches the public feed directly from Firestore.
 */
export const fetchPublicFeed = async (): Promise<Share[]> => {
    // The getPosts function from firebaseService now handles this.
    return await getPosts();
};

/**
 * Toggles a user's like on a post directly in Firestore.
 */
export const toggleLike = async (postId: string): Promise<Share> => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        throw new Error("User must be signed in to like a post.");
    }

    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
        throw new Error("Post not found.");
    }

    const postData = postSnap.data() as Share;
    const likes = postData.likes || [];
    const isLiked = likes.includes(user.uid);

    if (isLiked) {
        await unlikePost(postId, user.uid);
        postData.likes = likes.filter(uid => uid !== user.uid);
        postData.likeCount = (postData.likeCount || 1) - 1;
    } else {
        await likePost(postId, user.uid);
        if (!postData.likes) {
            postData.likes = [];
        }
        postData.likes.push(user.uid);
        postData.likeCount = (postData.likeCount || 0) + 1;
    }

    // Return the locally updated post data to provide immediate feedback to the UI.
    return postData;
};
