# Project Genie API Documentation

This API allows you to programmatically interact with Project Genie to create filters, outfits, apply effects to images, and search for content.

**Base URL**: The API is accessible relative to your application's base URL.
- Local development: `http://localhost:3000/api`
- Production: `https://your-app-domain.com/api`

## Endpoints

### 1. Create Filter
Creates a new filter configuration.

- **URL**: `/create-filter`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "name": "Retro Sunset",
  "prompt": "A vaporwave style sunset with neon colors",
  "previewImageUrl": "https://example.com/preview.png",
  "description": "Gives your photos a retro 80s vibe",
  "category": "Artistic",
  "creatorId": "user_123",
  "settings": {} 
}
```

**Response (201 Created):**
Returns the created Filter object including its generated `id`.

### 2. Create Outfit
Creates a new outfit configuration.

- **URL**: `/create-outfit`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "name": "Cyber Jacket",
  "prompt": "A futuristic cyberpunk leather jacket with glowing accents",
  "previewImageUrl": "https://example.com/jacket.png",
  "description": "High-tech streetwear",
  "category": "Fashion",
  "type": "merge"
}
```

**Response (201 Created):**
Returns the created Outfit object including its generated `id`.

### 3. Apply Filter
Applies a specific style or effect to an image using AI.

- **URL**: `/apply-filter`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...", // Base64 string or URL
  "filterPrompt": "Make it look like a pencil sketch"
}
```

**Response (200 OK):**
```json
{
  "resultImageUrl": "https://storage.googleapis.com/..." // Or base64 string
}
```

### 4. Apply Outfit
Merges an outfit onto a person in an image.

- **URL**: `/apply-outfit`
- **Method**: `POST`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "image": "data:image/png;base64,iVBORw0KGgo...", // Image of the person
  "outfitImage": "data:image/png;base64,iVBORw0KGgo...", // Image of the outfit
  "outfitPrompt": "A denim jacket" // Description of the outfit
}
```

**Response (200 OK):**
```json
{
  "resultImageUrl": "https://storage.googleapis.com/..." // Or base64 string
}
```

### 5. Search
Search for filters and outfits by name or prompt.

- **URL**: `/search`
- **Method**: `GET`
- **Query Parameters**:
    - `q`: The search query string (e.g., "cyberpunk").
    - `type`: (Optional) 'filter' or 'outfit'. If omitted, returns both.

**Example Request:**
`GET /api/search?q=summer&type=filter`

**Response (200 OK):**
Returns an array of matching Filter and/or Outfit objects.
```json
[
  {
    "id": "filter_123",
    "name": "Summer Vibes",
    "type": "filter",
    ...
  }
]
```
