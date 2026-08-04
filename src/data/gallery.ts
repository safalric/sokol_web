import manifest from "./gallery.json";

export type GalleryAlbum = {
  id: string;
  title: string;
  description: string;
};

export type GalleryPhoto = {
  id: string;
  albumId: string;
  title: string;
  year: string;
  alt: string;
  thumbSrc: string;
  largeSrc: string;
  thumbWidth: number;
  thumbHeight: number;
  width: number;
  height: number;
};

export const galleryAlbums = manifest.albums satisfies GalleryAlbum[];
export const galleryPhotos = manifest.photos satisfies GalleryPhoto[];

export function getGalleryAlbum(albumId: string) {
  return galleryAlbums.find((album) => album.id === albumId);
}
