
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface WardrobeItem {
  id: string;
  name: string;
  url: string;
}

export interface OutfitLayer {
  garment: WardrobeItem | null; // null represents the base model layer
  poseImages: Record<string, string>; // Maps pose instruction to image URL
  color?: string;
}

export interface SavedLook {
  id: string;
  name: string;
  url: string;
  createdAt: number;
  garmentColors?: string[];
}
