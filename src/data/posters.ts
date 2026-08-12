import posterData from "./posters.json";

export type SitePoster = {
  id: string;
  title: string;
  date: string;
  place: string;
  category: "Tábor" | "Cvičení";
  status: string;
  description: string;
  previewUrl: string;
  downloadUrl: string;
  downloadLabel: string;
  width: number;
  height: number;
  featured: boolean;
};

export const posters = posterData as SitePoster[];
export const featuredPosters = posters.filter((poster) => poster.featured);
