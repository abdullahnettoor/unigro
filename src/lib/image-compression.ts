/**
 * Client-side image compression utility to reduce storage footprint 
 * targeting 100-200KB per image (JPEG).
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export const compressImage = async (
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1000,
    maxHeight = 1000,
    quality = 0.5,
    mimeType = "image/jpeg",
  } = options;

  // Skip if file is already small (e.g. < 100KB)
  if (file.size < 100 * 1024) {
    console.log(`[Compression] Skipping ${file instanceof File ? file.name : 'blob'}: already small (${formatBytes(file.size)})`);

    if (file instanceof File) {
      return file;
    }

    return new File([file], `upload_${Date.now()}.jpg`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintain aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Failed to get canvas context"));
        }

        // Apply white background for JPEG (transparency turns black otherwise)
        if (mimeType === "image/jpeg") {
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Failed to compress image"));
            }

            // Reconstruct File object from Blob
            const fileName = (file as File).name || `upload_${Date.now()}.jpg`;
            const compressedFile = new File([blob], fileName, {
              type: mimeType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Helper to format bytes to human readable format
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
