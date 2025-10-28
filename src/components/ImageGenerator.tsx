  import { useState } from "react";
  import { fileToBase64WithHEIFSupport, isSupportedImageFormat, convertToPngBase64, extractBase64 } from "../utils/fileUtils";

  export default function ImageGenerator() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState("");
    const [transformedImage, setTransformedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

     
    
    // Removed R2 upload flow. Images are now converted to PNG base64 and sent directly to backend.

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setImageFile(file);
      if (!file) return;

      if (!isSupportedImageFormat(file)) {
        setImageFile(null);
        return;
      }

      try {
        const dataUrl = await fileToBase64WithHEIFSupport(file);
        setImagePreview(dataUrl);
      } catch {
        setImageFile(null);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      console.log("hello world");
      e.preventDefault();
      if (!imageFile || !prompt) return;

      setLoading(true);
      setTransformedImage(null);

      try {
        // Convert any input to PNG base64 (downscale to 1024px max dimension; no size cap)
        const pngDataUrl = await convertToPngBase64(imageFile, { maxDimension: 1024 });
        const imageBase64 = extractBase64(pngDataUrl);

        const res = await fetch("/api/nanobanana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textPrompt: prompt,
            imageBase64, // PNG base64 payload sent directly
          }),
        });

        const data = await res.json();

        if (data.imageBase64) {
          setTransformedImage(`data:image/png;base64,${data.imageBase64}`);
        } else if (data.transformedImage) {
          // Backward compatibility if backend still returns data URL
          setTransformedImage(data.transformedImage);
        } else {
          alert("No image returned from backend");
        }
      } catch (err) {
        console.error(err);
        alert("Error calling image API");
      } finally {
        setLoading(false);
      }
    };

    const handleDownload = () => {
      if (!transformedImage) return;
  
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const filename = `transformed-${timestamp}-${randomId}.png`;
  
      const a = document.createElement('a');
      a.href = transformedImage;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    return (
      <div style={{ padding: "1rem" }}>
        <h2>AI Image Generator</h2>
        <form onSubmit={handleSubmit}>
          <input type="file" accept="image/*,.heif,.heic" onChange={handleFileChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: "200px", margin: "10px 0" }}
            />
          )}
          <input
            type="text"
            placeholder="Enter transformation prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ width: "100%", margin: "10px 0" }}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Transforming..." : "Transform Image"}
          </button>
        </form>

        {transformedImage && (
          <div>
            <h3>Transformed Image:</h3>
            <img
              src={transformedImage}
              alt="Transformed"
              style={{ width: "300px", marginTop: "10px" }}
            />
            <button onClick={handleDownload} style={{ marginTop: '10px' }}>
              Download Image
            </button>
          </div>
        )}
      </div>
    );
  }
