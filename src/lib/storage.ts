// Firebase Storage connection disabled
// import { getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from "firebase/storage";
// import { FirebaseError } from "firebase/app";
// import { app, storage } from "@/lib/firebase";
import type { DocumentFile } from "@/lib/types";

// async function uploadWithStorage(targetStorage: FirebaseStorage, file: File, folder: string, id: string) {
//   const filePath = `${folder}/${Date.now()}-${id}-${file.name}`;
//   const fileRef = ref(targetStorage, filePath);

//   const contentType = file.type || "application/pdf";

//   await uploadBytes(fileRef, file, {
//     contentType,
//   });

//   return getDownloadURL(fileRef);
// }

export async function uploadDocument(file: File, folder: string, label?: string): Promise<DocumentFile> {
  console.warn("Firebase Storage disabled: uploadDocument() - file not uploaded");
  // Mock implementation returning the file metadata without upload
  const id = crypto.randomUUID();
  const contentType = file.type || "application/pdf";
  
  const documentFile: DocumentFile = {
    id,
    name: file.name,
    type: contentType,
    url: `blob:file-not-uploaded-${id}`,
    ...(label ? { label } : {}),
  };
  
  return documentFile;
}

export async function downloadDocument(url: string, fileName: string): Promise<void> {
  console.warn("Firebase Storage disabled: downloadDocument() - file not available", url, fileName);
  throw new Error("File download is not available - Firebase Storage is disabled");
}
