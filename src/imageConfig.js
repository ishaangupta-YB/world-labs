// Image configuration for use in HTML files
import { getImageUrl, ASSETS } from './config.js';

// Export image URLs for use in HTML
export const IMAGE_URLS = {
    COOPER_STATION_PREVIEW: getImageUrl(ASSETS.IMAGES.COOPER_STATION_PREVIEW),
    UNDERGROUND_PREVIEW: getImageUrl(ASSETS.IMAGES.UNDERGROUND_PREVIEW),
    VALLEY_PREVIEW: getImageUrl(ASSETS.IMAGES.VALLEY_PREVIEW),
    ANCIENT_PREVIEW: getImageUrl(ASSETS.IMAGES.ANCIENT_PREVIEW),
    ROME_PREVIEW: getImageUrl(ASSETS.IMAGES.ROME_PREVIEW),
    TEMPLE_PREVIEW: getImageUrl(ASSETS.IMAGES.TEMPLE_PREVIEW)
};

// Make it available globally for use in HTML
if (typeof window !== 'undefined') {
    window.IMAGE_URLS = IMAGE_URLS;
}