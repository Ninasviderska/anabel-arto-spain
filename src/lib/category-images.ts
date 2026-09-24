import bSuj from "@/assets/banners/categoria-sujetadores_8122-003.jpg.asset.json";
import bBrag from "@/assets/banners/categoria-braguitas_7017-011-022.jpg.asset.json";
import bPic from "@/assets/banners/categoria-picardias_8057-6732.jpg.asset.json";
import bCam from "@/assets/banners/categoria-camisones_8122-6033.jpg.asset.json";
import bBat from "@/assets/banners/categoria-batas_8122-6748.jpg.asset.json";

export interface CategoryImage {
  url: string;
  /** object-position tuned so face/garment stays in frame */
  position: string;
  /** Slight crop for source files that retain a white page margin. */
  zoom?: boolean;
}

/** Professional lookbook photos per category slug (banners + tiles). */
export const CATEGORY_IMAGES: Record<string, CategoryImage> = {
  sujetadores: { url: bSuj.url, position: "center 22%" },
  braguitas: { url: bBrag.url, position: "center 12%" },
  picardias: { url: bPic.url, position: "54% 12%", zoom: true },
  camisones: { url: bCam.url, position: "54% 5%", zoom: true },
  batas: { url: bBat.url, position: "center 0%" },
};
