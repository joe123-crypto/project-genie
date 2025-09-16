import { useState } from "react";

export default function ImageGenerator() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !prompt) return;

    setLoading(true);
    setTransformedImage(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result?.toString().split(",")[1]; // strip data URL prefix
      if (!base64Image) return;

      try {
        const res = await fetch("/api/nanobanana", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            textPrompt: prompt,
            images: [
              {
                mediaType: imageFile.type,
                data: base64Image,
              },
            ],
          }),
        });

        const data = await res.json();
        if (data.transformedImage) setTransformedImage(data.transformedImage);
        else alert("No image returned from backend");
      } catch (err) {
        console.error(err);
        alert("Error calling image API");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(imageFile);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>AI Image Generator</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
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
            src={transformedImage} // use data URL directly
            alt="Transformed"
            style={{ width: "300px", marginTop: "10px" }}
          />
        </div>
      )}
    </div>
  );
}
