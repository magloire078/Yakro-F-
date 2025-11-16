import placeholderData from '@/app/lib/placeholder-images.json';

type PlaceholderData = {
  url: string;
  width: number;
  height: number;
};

// Type assertion to inform TypeScript about the structure of the JSON file.
const placeholders = placeholderData as Record<string, PlaceholderData>;

/**
 * Retrieves placeholder image data from the central JSON file.
 * @param keywords - The keyword string corresponding to an image.
 * @returns An object with url, width, and height, or the default placeholder if not found.
 */
export function getPlaceholderImage(keywords: string | undefined): PlaceholderData {
    if (keywords && placeholders[keywords]) {
        return placeholders[keywords];
    }
    return placeholders['default'];
}
