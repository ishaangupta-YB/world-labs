// R2 Configuration - Uses environment variables for security
export const R2_BUCKET_URL = import.meta.env.VITE_R2_BUCKET_URL || 'https://pub-c101b1fa435b44a9a86cef9c78085b4f.r2.dev/public';

// Helper function to get R2 asset URL for 3D models
export function getAssetUrl(filename) {
    return `${R2_BUCKET_URL}/${filename}`;
}

// Helper function to get R2 image URL for previews
export function getImageUrl(filename) {
    return `${R2_BUCKET_URL}/${filename}`;
}

// Asset definitions for easy management
export const ASSETS = {
    // 3D Models (.spz files)
    MODELS: {
        ANCIENT: 'ancient.spz',
        COOPER_STATION: 'cooper_station.spz',
        DIS1: 'dis1.spz',
        MOUNTAIN: 'mountain.spz',
        ROME: 'rome.spz',
        TEMPLE: 'temple.spz'
    },

    // Preview Images (.webp files)
    IMAGES: {
        ANCIENT_PREVIEW: 'ancient_preview.webp',
        COOPER_STATION_PREVIEW: 'cooper_station_preview.webp',
        UNDERGROUND_PREVIEW: 'underground.webp',
        VALLEY_PREVIEW: 'valley_preview.webp',
        ROME_PREVIEW: 'rome_preview.webp',
        TEMPLE_PREVIEW: 'temple_preview.webp'
    }
};