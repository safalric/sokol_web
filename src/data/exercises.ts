import exerciseData from "./exercises.json";

export type Exercise = {
  id: string;
  title: string;
  age: string | null;
  description: string;
  place: string | null;
  sessions: { day: number; start: string; end: string }[];
  coaches: { name: string; phone?: string; email?: string }[];
  sourceUrl: string;
  publishedAt: string;
  poster: { previewUrl: string; downloadUrl: string; width: number; height: number };
  note?: string;
};

export const exerciseSchedule = exerciseData as {
  season: string; verifiedAt: string; sourceUrl: string; courses: Exercise[];
};
export const weekDayNames = ["Neděle", "Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota"];
