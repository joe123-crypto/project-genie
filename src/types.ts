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
    accessCount: number;
    createdAt: string;
    updatedAt: string;
    creatorId: string;
    settings: any;
    type?: "single" | "merge";
    category: string;
    userId?: string;
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
    | { view: "feed" };
  