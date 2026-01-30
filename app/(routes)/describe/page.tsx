"use client";

import { useRef } from "react";

export default function DescribePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/describe-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      // Log the full response to console as requested
      console.log("Describe image response:", data);

      if (!res.ok) {
        console.error("API error:", data.error ?? data);
        return;
      }
      if (data.description) {
        console.log("Description:", data.description);
      }
    } catch (err) {
      console.error("Request failed:", err);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        Image describe (GPT vision)
      </h1>
      <p className="text-muted-foreground text-sm mb-6 text-center max-w-md">
        Upload an image — it will be sent to the backend automatically. Check
        the browser console for the response.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="block w-full max-w-xs text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:cursor-pointer hover:file:opacity-90 cursor-pointer"
      />
    </div>
  );
}
