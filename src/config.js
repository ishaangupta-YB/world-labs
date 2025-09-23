// R2 Configuration
// Replace YOUR-BUCKET-URL with your actual R2 public bucket URL
// Example: https://pub-1234567890abcdef.r2.dev
export const R2_BUCKET_URL = 'YOUR-BUCKET-URL';

// Helper function to get R2 asset URL
export function getAssetUrl(filename) {
    return `${R2_BUCKET_URL}/${filename}`;
}