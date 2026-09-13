function dateValue(value) {
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "") || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid exercise calendar date: ${value}`);
  }
  return date;
}

export function generateExerciseEvents(exercises, rules) {
  const first = dateValue(rules.startsOn);
  const last = dateValue(rules.endsOn);
  if (rules.season !== exercises.season || last < first || last - first > 366 * 86400000) {
    throw new Error("Exercise calendar must use the current, bounded season");
  }
  const breaks = rules.schoolBreaks.map(({ from, to }) => {
    if (dateValue(from) > dateValue(to)) throw new Error("Invalid school break range");
    return { from, to };
  });
  const excluded = new Set([...rules.publicHolidays, ...rules.excludedDates].map((date) => {
    dateValue(date);
    return date;
  }));
  const cancellations = new Set(rules.cancelledSessions.map(({ courseId, date, start }) => {
    dateValue(date);
    const course = exercises.courses.find(({ id }) => id === courseId);
    if (!course?.sessions.some((session) => session.start === start && session.day === dateValue(date).getUTCDay())) {
      throw new Error("Cancellation must match an existing exercise session");
    }
    return `${courseId}:${date}:${start}`;
  }));
  const events = [];
  // Iterate civil dates in UTC; local clock times remain unchanged across DST.
  for (const day = new Date(first); day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
    const date = day.toISOString().slice(0, 10);
    if (excluded.has(date) || breaks.some(({ from, to }) => date >= from && date <= to)) continue;
    for (const course of exercises.courses) {
      if (date < course.publishedAt) continue;
      for (const session of course.sessions) {
        if (session.day !== day.getUTCDay() || cancellations.has(`${course.id}:${date}:${session.start}`)) continue;
        events.push({
          id: `exercise-${course.id}-${date}-${session.start.replace(":", "")}`,
          date,
          title: course.title,
          time: `${session.start}–${session.end}`,
          category: "training",
          place: course.place || "Místo upřesní cvičitel",
          sourceUrl: course.sourceUrl,
          detailUrl: `/cviceni#${course.id}`,
          published: true,
        });
      }
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.id.localeCompare(b.id));
}
