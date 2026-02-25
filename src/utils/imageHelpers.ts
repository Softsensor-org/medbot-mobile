/**
 * Convert an image URI (from camera/picker) to a base64 data URL.
 * Returns format: data:image/<type>;base64,<data>
 */
export async function uriToBase64DataUrl(uri: string): Promise<string> {
  // expo-image-picker returns file:// URIs on native
  const response = await fetch(uri);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image as base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Extract MIME type from a data URL. */
export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}
