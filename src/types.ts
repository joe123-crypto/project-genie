export interface Outfit {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewImageUrl: string;
  category: string;
  type?: "single" | "merge"; // Add new type property
  userId?: string;
  username?: string;
  accessCount?: number;
  // FIX: Add optional createdAt property to match Firestore data and fix destructuring in App.tsx.
  createdAt?: string;
}

export interface Filter {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewImageUrl: string;
  category: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  settings: any;
  type?: "single" | "merge";
  username?: string;
}

export interface Hairstyle {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  gender: 'male' | 'female' | 'unisex';
  userId?: string;
  username?: string;
  accessCount?: number;
  createdAt?: string;
  prompt?: string;
}

export interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewImageUrl: string; // Cover image for the template
  category: string;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  username?: string;
}

export interface User {
  uid: string;
  email: string;
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  displayName?: string;
  photoURL?: string;
  username?: string;
}

export interface Share {
  id: string;
  imageUrl: string;
  originalImageUrl?: string;
  filteredImageUrl?: string;
  userId?: string;
  username?: string;
  filterId: string;
  filterName: string;
  createdAt: string;
  authorId?: string;
  prompt?: string;
  likes?: string[];
  likeCount?: number;
  author?: User;
  image?: string;
  url?: string;
}

// A Post is functionally the same as a Share in this application
export type Post = Share;

export type ViewState =
  | { view: "marketplace" }
  | { view: "apply"; filter: Filter }
  | { view: "create" }
  | { view: "createFilter" }
  | { view: "createOutfit" }
  | { view: "edit"; filter: Filter }
  | { view: "auth" }
  | { view: "shared"; shareId: string }
  | { view: "outfits" }
  | { view: "applyOutfit"; outfit: Outfit }
  | { view: "profile"; user?: User }
  | { view: "feed" }
  | { view: "search" }
  | { view: "search" }
  | { view: "initialAuth" }
  | { view: "hairstyles" }
  | { view: "createHairstyle"; editingHairstyle?: Hairstyle }
  | { view: "applyHairstyle"; hairstyle: Hairstyle }
  | { view: "videos" }
  | { view: "createVideo"; editingVideo?: VideoTemplate }
  | { view: "applyVideo"; videoTemplate: VideoTemplate };
