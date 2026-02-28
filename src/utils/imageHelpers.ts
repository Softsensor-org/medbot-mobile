import { Platform } from "react-native";
import { File } from "expo-file-system";

/**
 * Convert an image URI (from camera/picker) to a base64 data URL.
 * Returns format: data:image/<type>;base64,<data>
 *
 * Uses expo-file-system File.base64() on native (FileReader is a Web API
 * unavailable in React Native / Hermes). Falls back to fetch+FileReader on web.
 */
export async function uriToBase64DataUrl(uri: string): Promise<string> {
  if (Platform.OS === "web") {
    // Web: FileReader is available
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

  // Native: use expo-file-system (SDK 54+ class-based API)
  const file = new File(uri);
  const base64 = await file.base64();
  const mime = inferMimeFromUri(uri);
  return `data:${mime};base64,${base64}`;
}

/** Extract MIME type from a data URL. */
export function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? "image/jpeg";
}

/** Infer MIME type from a file URI extension. */
function inferMimeFromUri(uri: string): string {
  const ext = uri.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "heic":
    case "heif":
      return "image/heic";
    default:
      return "image/jpeg";
  }
}
