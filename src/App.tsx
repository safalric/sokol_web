import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { AboutPage, ContactPage, GalleryPage, HistoryPage, MemberApplicationPage } from "./pages/OrganizationPages";
import { PrivacyPage } from "./pages/PrivacyPage";
import { CalendarPage, EventsPage, ExercisePage } from "./pages/ProgramPages";
import { normalizePath, PAGE_TITLES } from "./routes";

export function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    document.title =
      currentPath === "/"
        ? "TJ Sokol Doudleby nad Orlicí – Sport a cvičení pro všechny"
        : `${PAGE_TITLES[currentPath]} | TJ Sokol Doudleby nad Orlicí`;
  }, [currentPath]);

  const navigate = (href: string) => {
    const nextPath = normalizePath(href);
    if (nextPath === currentPath) return;

    window.history.pushState({}, "", nextPath);
    setCurrentPath(nextPath);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-sokol-paper text-sokol-ink">
      <a className="skip-link" href="#main-content">Přejít na obsah</a>
      <Header currentPath={currentPath} onNavigate={navigate} />
      <main id="main-content" className="flex-1" tabIndex={-1}>
        {currentPath === "/" ? <HomePage onNavigate={navigate} /> : null}
        {currentPath === "/o-nas" ? <AboutPage onNavigate={navigate} /> : null}
        {currentPath === "/cviceni" ? <ExercisePage /> : null}
        {currentPath === "/akce" ? <EventsPage /> : null}
        {currentPath === "/kalendar" ? <CalendarPage /> : null}
        {currentPath === "/prihlaska" ? <MemberApplicationPage /> : null}
        {currentPath === "/fotogalerie" ? <GalleryPage /> : null}
        {currentPath === "/historie" ? <HistoryPage /> : null}
        {currentPath === "/kontakt" ? <ContactPage onNavigate={navigate} /> : null}
        {currentPath === "/gdpr" ? <PrivacyPage /> : null}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
