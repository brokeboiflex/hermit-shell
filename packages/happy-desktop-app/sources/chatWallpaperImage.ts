/**
 * The longest edge a chosen wallpaper keeps. The chat lane rarely shows more at
 * 2x, the picture sits under a veil that hides finer detail, and the host keeps
 * it in window storage, where every byte counts against a few megabytes.
 */
const LONGEST_EDGE = 1920;

/**
 * Reads a picture file the person chose as their chat wallpaper into a JPEG
 * data URL no longer than 1920px on either edge, as `ThemeScope` paints it and
 * the host keeps it. The file is decoded with its own orientation applied, so a
 * photo taken on its side stands as it was taken.
 */
export async function chatWallpaperImageRead(file: Blob): Promise<string> {
    const bitmap = await createImageBitmap(file);
    try {
        const scale = Math.min(1, LONGEST_EDGE / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("The picture could not be drawn.");
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", 0.82);
    } finally {
        bitmap.close();
    }
}
