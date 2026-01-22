# GenAIe Application Documentation

GenAIe is an AI-powered image editing and generation platform that allows users to apply filters, merge outfits/hairstyles, and generate videos using Google's Gemini models.

## Architecture Overview

The application follows a modern serverless architecture integrated with specialized AI and storage services.

### Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS.
- **Backend API**: Next.js API Routes (Pages directory style).
- **Authentication**: Firebase Authentication.
- **Database**: Firebase Firestore.
- **Core Storage**: Firebase Storage (for legacy/user uploads).
- **AI Image Storage**: Cloudflare R2 (S3-compatible).
- **AI Engine**: Google Gemini (Pro Vision / Pro Image) via Vercel AI SDK and AI Gateway.

### Technical Architecture Diagram

```mermaid
graph TD
    User((User)) --> WebApp[Next.js App Router / React]
    WebApp --> Auth[Firebase Auth]
    WebApp --> Firestore[Firestore Database]
    WebApp --> APIRoutes[Next.js API Routes]
    
    APIRoutes --> AIGateway[Vercel AI Gateway]
    AIGateway --> Gemini[Google Gemini API]
    
    APIRoutes --> R2[Cloudflare R2 Storage]
    WebApp --> FBStorage[Firebase Storage]
    
    subgraph "Data Storage"
        Firestore
        R2
        FBStorage
    end
    
    subgraph "AI Processing"
        AIGateway
        Gemini
    end
```

## Data Flow

### Image Processing Flow (Filtering/Merging)
1. **User Upload**: The user uploads an image in the UI (`ApplyFilterView`).
2. **Client-Side Processing**: The image is downscaled in the browser (`downscale.ts`).
3. **API Call**: The frontend calls a service (`geminiService.ts`), which hits an API route (`/api/nanobanana`).
4. **AI Processing**: The API route sends the image and prompt to the Gemini model through the AI Gateway.
5. **Storage**: The generated image is uploaded to Cloudflare R2.
6. **Result**: The public URL of the generated image is returned to the client and displayed.

### Data Flow Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client (React)
    participant S as Next.js API
    participant AI as AI Gateway (Gemini)
    participant R2 as Cloudflare R2
    participant DB as Firestore
    
    U->>C: Upload Image & Select Filter
    C->>C: Downscale Image (Browser)
    C->>S: POST /api/nanobanana (Image + Prompt)
    S->>AI: Request Generation
    AI-->>S: Return Generated Image (Base64)
    S->>R2: Upload to Storage
    R2-->>S: Public URL
    S-->>C: JSON { imageUrl: URL }
    C->>U: Show Generated Image
    U->>C: Click "Save/Share"
    C->>DB: Record Interaction
```

## Key Components

### 1. Main Entry Point (`src/app/page.tsx`)
The root page acts as a orchestrator, managing the application's visual state (`marketplace`, `apply`, `profile`, etc.) and handling initial data fetching (filters, outfits, hairstyles).

### 2. AI Services (`src/services/geminiService.ts`)
Encapsulates all AI-related logic, including prompt engineering with system instructions to ensure identity preservation and high-quality outputs.

### 3. API Routes (`src/pages/api/*`)
- `/api/nanobanana`: The primary engine for image-to-image and text-to-image generation.
- `/api/gemini`: Handles text-based generation and prompt improvement.
- `/api/save-image`: Handles direct uploads to Cloudflare R2.

### 4. Data Models (`src/types.ts`)
Defines the core entities:
- `Filter`: Prompt-based visual effects.
- `Outfit`: Stylized clothing to be merged.
- `Hairstyle`: Transferred hair styles.
- `Share/Post`: User-generated content shared with the community.

## Deployment & Infrastructure
- **Hosting**: Vercel.
- **Storage Configuration**: Environment variables are used for R2 endpoints and Firebase credentials.
- **Native Support**: Capacitor is integrated for Android/iOS builds, with specific plugins handle file saving on mobile.
## File Structure (Comprehensive)

```mermaid
graph LR
    subgraph Root [Project Root]
        R[project-genie]
        CONFIG[Config Files]
        R --> CONFIG
        CONFIG --> ENV[.env.local]
        CONFIG --> FIREBASE_RC[.firebaserc]
        CONFIG --> CAPACITOR[capacitor.config.json]
        CONFIG --> FB_JSON[firebase.json]
        CONFIG --> FS_RULES[firestore.rules]
        CONFIG --> PKG[package.json]
        CONFIG --> TW[tailwind.config.js]
        CONFIG --> TS[tsconfig.json]
    end

    subgraph Source [src/ Directory]
        R --> SRC[src]
        SRC --> APP[app]
        SRC --> PAGES[pages]
        SRC --> COMPONENTS[components]
        SRC --> SERVICES[services]
        SRC --> LIB[lib]
        SRC --> UTILS[utils]
        SRC --> PLUGINS[plugins]
        SRC --> TYPES[types.ts]
        SRC --> CONST[constants.ts]

        subgraph APP_DIR [app/]
            APP --> APP_LAYOUT[layout.tsx]
            APP --> APP_PAGE[page.tsx]
            APP --> APP_CSS[globals.css]
            APP --> APP_NF[not-found.tsx]
        end

        subgraph PAGES_DIR [pages/api/]
            PAGES --> API[api]
            API --> API_NB[nanobanana.ts]
            API --> API_GM[gemini.ts]
            API --> API_GF[generate-filter.ts]
            API --> API_SI[save-image.ts]
            API --> API_FE[feed.ts]
            API --> API_SH[share.ts]
        end

        subgraph COMP_DIR [components/]
            COMPONENTS --> C_MAIN[Main Views]
            C_MAIN --> C_LP[LandingPage.tsx]
            C_MAIN --> C_MP[Marketplace.tsx]
            C_MAIN --> C_FV[ApplyFilterView.tsx]
            C_MAIN --> C_OV[ApplyOutfitView.tsx]
            C_MAIN --> C_HV[ApplyHairstyleView.tsx]
            C_MAIN --> C_PV[ProfileView.tsx]
            C_MAIN --> C_FEV[FeedView.tsx]
            
            COMPONENTS --> C_UI[UI Elements]
            C_UI --> C_NAV[Dashboard.tsx]
            C_UI --> C_SP[Spinner.tsx]
            C_UI --> C_ICONS[icons.tsx]
            C_UI --> C_CARD[FilterCard.tsx]
        end

        subgraph SERV_DIR [services/]
            SERVICES --> S_FB[firebaseService.ts]
            SERVICES --> S_GM[geminiService.ts]
            SERVICES --> S_AU[authService.ts]
            SERVICES --> S_US[userService.ts]
            SERVICES --> S_SH[shareService.ts]
        end

        subgraph LIB_DIR [lib/]
            LIB --> L_FB[firebase.ts]
            LIB --> L_FBA[firebaseAdmin.ts]
        end

        subgraph UTIL_DIR [utils/]
            UTILS --> U_DS[downscale.ts]
            UTILS --> U_API[api.ts]
            UTILS --> U_TH[theme.ts]
        end
    end

    subgraph External [External Folders]
        R --> ANDROID[android/ - Capacitor]
        R --> FUNCTIONS[functions/ - FB Functions]
        R --> PUBLIC[public/ - Assets]
    end
```
