# Authentication Logic Diagram

This diagram explains the complete authentication lifecycle in the project, from initial page load to secure API requests.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant Page as src/app/page.tsx
    participant UI as src/components/InitialAuthView.tsx
    participant Service as src/services/authService.ts
    participant FirebaseSDK as Firebase Auth (JS SDK)
    participant APIRoute as src/app/api/user/route.ts
    participant FirebaseAdmin as src/lib/firebaseAdmin.ts

    Note over User, Page: 1. Initial Load & Session Check
    Page->>Service: getAuthUser()
    Service->>FirebaseSDK: onAuthStateChanged()
    FirebaseSDK-->>Service: user object
    Service->>Service: saveUserSession(user) (localStorage)
    Service-->>Page: appUser (mapped)
    Page->>Page: setUser(appUser)

    Note over User, UI: 2. User Authentication (Sign In/Up)
    User->>UI: Enter email, password, username
    UI->>Service: signIn(email, password) / signUp(...)
    Service->>FirebaseSDK: signInWithEmailAndPassword()
    FirebaseSDK-->>Service: userCredential
    Service->>Service: saveUserSession(appUser)
    Service-->>UI: appUser
    UI->>Page: onSignInSuccess(appUser)
    Page->>Page: setUser(appUser)

    Note over Page, APIRoute: 3. Authorized API Request
    Page->>Service: getValidIdToken()
    Service->>FirebaseSDK: getIdToken(forceRefresh=true)
    FirebaseSDK-->>Service: idToken
    Service-->>Page: idToken
    Page->>APIRoute: req (Header: Authorization: Bearer <idToken>)
    APIRoute->>FirebaseAdmin: initializeFirebaseAdmin()
    APIRoute->>FirebaseAdmin: verifyIdToken(idToken)
    FirebaseAdmin-->>APIRoute: decodedToken (contains uid)
    APIRoute-->>Page: HTTP Response (e.g. 200 OK)
```

## Key Files and Functions

### 1. Client-Side Service: `src/services/authService.ts`
- **`getAuthUser()`**: Listens for auth state changes using the Firebase JS SDK and retrieves the current user.
- **`signIn()` / `signUp()` / `signInWithGoogle()`**: High-level wrappers for Firebase authentication methods.
- **`getValidIdToken()`**: Retrieves the Firebase ID token, which is required for authentication in backend requests.
- **`saveUserSession()`**: Persists the user object in `localStorage` under the key `genieUser`.

### 2. Main Page Logic: `src/app/page.tsx`
- **`useEffect` (Initial Load)**: Calls `getAuthUser()` to check for an existing session and updates the component's `user` state.
- **`handleSignInSuccess()`**: Updates the application state once a user has successfully authenticated.

### 3. Server-Side Verification: `src/app/api/user/route.ts` & `src/lib/firebaseAdmin.ts`
- **`initializeFirebaseAdmin()`**: Initializes the Firebase Admin SDK for server-side operations.
- **`verifyIdToken()`**: A method from `firebase-admin/auth` used within API routes to validate the token sent from the client.
