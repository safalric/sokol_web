import posterData from "./posters.json";
import { exerciseSchedule } from "./exercises";
import { memberApplicationUrl } from "./siteContent";

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
  registrationUrl?: string;
  sourceUrl?: string;
};

export const archivedPosters = posterData as SitePoster[];
export const currentPosters: SitePoster[] = exerciseSchedule.courses.map((course) => ({
  id: `${course.id}-2026-2027`,
  title: course.title,
  date: `Sezóna ${exerciseSchedule.season}`,
  place: course.place ?? "Místo upřesní trenérky",
  category: "Cvičení",
  status: "Sezóna 2026/2027",
  description: course.description,
  ...course.poster,
  downloadLabel: "Stáhnout plakát v JPG",
  featured: ["baby-pondeli", "florbal", "predskolaci"].includes(course.id),
  registrationUrl: memberApplicationUrl,
  sourceUrl: course.sourceUrl,
}));
export const posters = [...currentPosters, ...archivedPosters];
export const featuredPosters = currentPosters.filter((poster) => poster.featured);
