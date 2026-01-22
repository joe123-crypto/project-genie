import { db, storage } from '../lib/firebase';
import {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    increment,
    serverTimestamp,
    query,
    orderBy,
    limit
} from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { Filter, Outfit, Post, Hairstyle } from '../types';

const FILTERS_COLLECTION = 'filters';
const OUTFITS_COLLECTION = 'outfits';
const HAIRSTYLES_COLLECTION = 'hairstyles';
const POSTS_COLLECTION = 'posts';

/**
 * Fetches all filters from Firestore.
 */
export const getFilters = async (): Promise<Filter[]> => {
    try {
        const q = query(collection(db, FILTERS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Filter));
    } catch (error) {
        console.error('Error fetching filters:', error);
        throw error;
    }
};

/**
 * Fetches a single filter by its ID from Firestore.
 */
export const getFilterById = async (id: string): Promise<Filter | null> => {
    try {
        const docRef = doc(db, FILTERS_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Filter;
        } else {
            console.warn(`Filter with id ${id} not found.`);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching filter with id ${id}:`, error);
        throw error;
    }
};

/**
 * Saves a filter to Firestore.
 */
export const saveFilter = async (filter: Omit<Filter, 'id'>): Promise<Filter> => {
    try {
        const docRef = await addDoc(collection(db, FILTERS_COLLECTION), {
            ...filter,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            accessCount: 0
        });
        return { id: docRef.id, ...filter, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), accessCount: 0 };
    } catch (error) {
        console.error('Error saving filter:', error);
        throw error;
    }
};

/**
 * Saves a base64 encoded image to Firebase Storage.
 */
export const saveImage = async (imageB64: string, destination: 'saved' | 'shared', userId: string): Promise<string> => {
    try {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(2, 8);
        const imagePath = `${destination}/${userId}/${timestamp}-${randomId}.png`;

        const storageRef = ref(storage, imagePath);

        await uploadString(storageRef, imageB64, 'data_url');

        const downloadUrl = await getDownloadURL(storageRef);

        return downloadUrl;
    } catch (error) {
        console.error('Error saving image to storage:', error);
        throw error;
    }
};

/**
 * Deletes a filter from Firestore.
 */
export const deleteFilter = async (filterId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, FILTERS_COLLECTION, filterId));
    } catch (error) {
        console.error('Error deleting filter:', error);
        throw error;
    }
};

/**
 * Updates a filter in Firestore.
 */
export const updateFilter = async (filterId: string, filterData: Partial<Filter>): Promise<Filter> => {
    try {
        const filterRef = doc(db, FILTERS_COLLECTION, filterId);
        await updateDoc(filterRef, { ...filterData, updatedAt: serverTimestamp() });
        const updatedDoc = await getDoc(filterRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as Filter;
    } catch (error) {
        console.error('Error updating filter:', error);
        throw error;
    }
};

/**
 * Increments the access count for a filter.
 */
export const incrementFilterAccessCount = async (filterId: string): Promise<void> => {
    try {
        const filterRef = doc(db, FILTERS_COLLECTION, filterId);
        await updateDoc(filterRef, { accessCount: increment(1) });
    } catch (error) {
        console.error('Error incrementing filter access count:', error);
        // Non-critical, so we don't re-throw
    }
};

/**
 * Fetches all outfits from Firestore.
 */
export const getOutfits = async (): Promise<Outfit[]> => {
    try {
        const q = query(collection(db, OUTFITS_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outfit));
    } catch (error) {
        console.error('Error fetching outfits:', error);
        throw error;
    }
};

/**
 * Saves an outfit to Firestore.
 */
export const saveOutfit = async (outfitData: Omit<Outfit, 'id'>): Promise<Outfit> => {
    try {
        const docRef = await addDoc(collection(db, OUTFITS_COLLECTION), {
            ...outfitData,
            createdAt: serverTimestamp(),
            accessCount: 0
        });
        return { id: docRef.id, ...outfitData, createdAt: new Date().toISOString(), accessCount: 0 };
    } catch (err) {
        console.error('❌ Error in saveOutfit:', err);
        throw err;
    }
};

/**
 * Increments the access count for an outfit.
 */
export const incrementOutfitAccessCount = async (outfitId: string): Promise<void> => {
    try {
        const outfitRef = doc(db, OUTFITS_COLLECTION, outfitId);
        await updateDoc(outfitRef, { accessCount: increment(1) });
    } catch (error) {
        console.error('Error incrementing outfit access count:', error);
        // Non-critical, so we don't re-throw
    }
};

/**
 * Fetches all hairstyles from Firestore.
 */
export const getHairstyles = async (): Promise<Hairstyle[]> => {
    try {
        const q = query(collection(db, HAIRSTYLES_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Hairstyle));
    } catch (error) {
        console.error('Error fetching hairstyles:', error);
        throw error;
    }
};

/**
 * Saves a hairstyle to Firestore.
 */
/**
 * Saves a hairstyle to Firestore.
 */
export const saveHairstyle = async (hairstyleData: Omit<Hairstyle, 'id'>): Promise<Hairstyle> => {
    try {
        const docRef = await addDoc(collection(db, HAIRSTYLES_COLLECTION), {
            ...hairstyleData,
            createdAt: serverTimestamp(),
            accessCount: 0
        });
        return { id: docRef.id, ...hairstyleData, createdAt: new Date().toISOString(), accessCount: 0 };
    } catch (err) {
        console.error('❌ Error in saveHairstyle:', err);
        throw err;
    }
};

/**
 * Increments the access count for a hairstyle.
 */
export const incrementHairstyleAccessCount = async (hairstyleId: string): Promise<void> => {
    try {
        const hairstyleRef = doc(db, HAIRSTYLES_COLLECTION, hairstyleId);
        await updateDoc(hairstyleRef, { accessCount: increment(1) });
    } catch (error) {
        console.error('Error incrementing hairstyle access count:', error);
        // Non-critical, so we don't re-throw
    }
};

/**
 * Deletes a hairstyle from Firestore.
 */
export const deleteHairstyle = async (hairstyleId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, HAIRSTYLES_COLLECTION, hairstyleId));
    } catch (error) {
        console.error('Error deleting hairstyle:', error);
        throw error;
    }
};

/**
 * Updates a hairstyle in Firestore.
 */
export const updateHairstyle = async (hairstyleId: string, hairstyleData: Partial<Hairstyle>): Promise<Hairstyle> => {
    try {
        const hairstyleRef = doc(db, HAIRSTYLES_COLLECTION, hairstyleId);
        await updateDoc(hairstyleRef, { ...hairstyleData, updatedAt: serverTimestamp() });
        const updatedDoc = await getDoc(hairstyleRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as Hairstyle;
    } catch (error) {
        console.error('Error updating hairstyle:', error);
        throw error;
    }
};

/**
 * Fetches all posts from Firestore.
 */
export const getPosts = async (): Promise<Post[]> => {
    try {
        const q = query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"), limit(50));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
        console.error('Error fetching posts:', error);
        throw error;
    }
};

/**
 * Likes a post.
 */
export const likePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            const likes = postData.likes || [];
            if (!likes.includes(userId)) {
                await updateDoc(postRef, { likes: [...likes, userId] });
            }
        }
    } catch (error) {
        console.error('Error liking post:', error);
        throw error;
    }
};

/**
 * Unlikes a post.
 */
export const unlikePost = async (postId: string, userId: string): Promise<void> => {
    try {
        const postRef = doc(db, POSTS_COLLECTION, postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            let likes = postData.likes || [];
            if (likes.includes(userId)) {
                likes = likes.filter((id: string) => id !== userId);
                await updateDoc(postRef, { likes });
            }
        }
    } catch (error) {
        console.error('Error unliking post:', error);
        throw error;
    }
};

const VIDEO_TEMPLATES_COLLECTION = 'video_templates';
import { VideoTemplate } from '../types';

/**
 * Fetches all video templates from Firestore.
 */
export const getVideoTemplates = async (): Promise<VideoTemplate[]> => {
    try {
        const q = query(collection(db, VIDEO_TEMPLATES_COLLECTION), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoTemplate));
    } catch (error) {
        console.error('Error fetching video templates:', error);
        throw error;
    }
};

/**
 * Saves a video template to Firestore.
 */
export const saveVideoTemplate = async (templateData: Omit<VideoTemplate, 'id'>): Promise<VideoTemplate> => {
    try {
        const docRef = await addDoc(collection(db, VIDEO_TEMPLATES_COLLECTION), {
            ...templateData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            accessCount: 0
        });
        return { id: docRef.id, ...templateData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), accessCount: 0 };
    } catch (err) {
        console.error('❌ Error in saveVideoTemplate:', err);
        throw err;
    }
};

/**
 * Deletes a video template from Firestore.
 */
export const deleteVideoTemplate = async (templateId: string): Promise<void> => {
    try {
        await deleteDoc(doc(db, VIDEO_TEMPLATES_COLLECTION, templateId));
    } catch (error) {
        console.error('Error deleting video template:', error);
        throw error;
    }
};

/**
 * Updates a video template in Firestore.
 */
export const updateVideoTemplate = async (templateId: string, templateData: Partial<VideoTemplate>): Promise<VideoTemplate> => {
    try {
        const templateRef = doc(db, VIDEO_TEMPLATES_COLLECTION, templateId);
        await updateDoc(templateRef, { ...templateData, updatedAt: serverTimestamp() });
        const updatedDoc = await getDoc(templateRef);
        return { id: updatedDoc.id, ...updatedDoc.data() } as VideoTemplate;
    } catch (error) {
        console.error('Error updating video template:', error);
        throw error;
    }
};

/**
 * Increments the access count for a video template.
 */
export const incrementVideoAccessCount = async (templateId: string): Promise<void> => {
    try {
        const templateRef = doc(db, VIDEO_TEMPLATES_COLLECTION, templateId);
        await updateDoc(templateRef, { accessCount: increment(1) });
    } catch (error) {
        console.error('Error incrementing video template access count:', error);
        // Non-critical
    }
};
