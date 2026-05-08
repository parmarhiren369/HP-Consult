import { getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
import { FirebaseError } from "firebase/app";
import { app, storage } from "@/lib/firebase";
import type { DocumentFile } from "@/lib/types";

async function uploadWithStorage(targetStorage: FirebaseStorage, file: File, folder: string, id: string) {
  const filePath = `${folder}/${Date.now()}-${id}-${file.name}`;
  const fileRef = ref(targetStorage, filePath);

  const contentType = file.type || "application/pdf";

  await uploadBytes(fileRef, file, {
    contentType,
  });

  return getDownloadURL(fileRef);
}

export async function uploadDocument(file: File, folder: string, label?: string): Promise<DocumentFile> {
  const id = crypto.randomUUID();
  const contentType = file.type || "application/pdf";

  try {
    let url = await uploadWithStorage(storage, file, folder, id);

    if (!url) {
      throw new Error("File upload failed: no download URL returned.");
    }

    const documentFile: DocumentFile = {
      id,
      name: file.name,
      type: contentType,
      url,
      ...(label ? { label } : {}),
    };

    console.log("Document uploaded successfully:", documentFile);
    return documentFile;
  } catch (error) {
    if (error instanceof FirebaseError) {
      if (error.code === "storage/bucket-not-found") {
        const activeBucket = storage.app.options.storageBucket || "";
        const fallbackBucket = activeBucket.endsWith(".firebasestorage.app")
          ? activeBucket.replace(".firebasestorage.app", ".appspot.com")
          : activeBucket.endsWith(".appspot.com")
            ? activeBucket.replace(".appspot.com", ".firebasestorage.app")
            : "";

        if (fallbackBucket) {
          try {
            const fallbackStorage = getStorage(app, `gs://${fallbackBucket}`);
            const fallbackUrl = await uploadWithStorage(fallbackStorage, file, folder, id);
            const documentFile: DocumentFile = {
              id,
              name: file.name,
              type: contentType,
              url: fallbackUrl,
              ...(label ? { label } : {}),
            };
            console.log("Document uploaded with fallback bucket:", documentFile);
            return documentFile;
          } catch {
            throw new Error("File upload failed: Firebase Storage bucket is not configured correctly.");
          }
        }
      }
      if (error.code === "storage/unauthorized") {
        throw new Error("File upload blocked: update Firebase Storage rules to allow write access.");
      }
      if (error.code === "storage/bucket-not-found") {
        throw new Error("File upload failed: Firebase Storage bucket is not configured correctly.");
      }
      if (error.code === "storage/canceled") {
        throw new Error("File upload canceled.");
      }
      throw new Error(`File upload failed: ${error.message}`);
    }

    throw new Error("File upload failed due to an unexpected error.");
  }
}

export async function downloadDocument(url: string, fileName: string): Promise<void> {
  try {
    // Fetch the file from Firebase Storage as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const blob = await response.blob();

    // Create a blob URL and trigger download
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to download document";
    throw new Error(message);
  }
}
