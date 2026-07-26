(function initializeTheme() {
  var storageKey = "sokol-theme";
  var storedTheme = null;

  try {
    storedTheme = window.localStorage.getItem(storageKey);
  } catch {
    storedTheme = null;
  }

  var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  var theme = storedTheme === "dark" || storedTheme === "light" ? storedTheme : prefersDark ? "dark" : "light";
  var root = document.documentElement;
  var themeColor = document.getElementById("theme-color");

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#0c0f14" : "#ffffff");
})();
