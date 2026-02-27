export type ThemePreference = "system" | "dark" | "light";
export type ThemeVariant = "default" | "ocean" | "clay" | "dusk";
const THEME_KEY = "theme-preference";
const VARIANT_KEY = "theme-variant";
const DARK_COLOR = "#0F1F1A";
const LIGHT_COLOR = "#F6F5F2";

let systemMedia: MediaQueryList | null = null;
let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

const getSystemTheme = (): "dark" | "light" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const withThemeTransition = (fn: () => void) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    fn();
    return;
  }
  const root = document.documentElement;
  root.classList.add("theme-transition");
  fn();
  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 220);
};

const setThemeColorMeta = (theme: "dark" | "light") => {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "dark" ? DARK_COLOR : LIGHT_COLOR);
  }
};

export const applyThemePreference = (pref: ThemePreference) => {
  const theme = pref === "system" ? getSystemTheme() : pref;
  withThemeTransition(() => {
    document.documentElement.setAttribute("data-theme", theme);
    setThemeColorMeta(theme);
  });
};

export const getThemeVariant = (): ThemeVariant => {
  const stored = localStorage.getItem(VARIANT_KEY);
  if (stored === "default" || stored === "ocean" || stored === "clay" || stored === "dusk") {
    return stored;
  }
  return "default";
};

export const applyThemeVariant = (variant: ThemeVariant) => {
  if (variant !== "default") {
    document.documentElement.setAttribute("data-theme-variant", variant);
  } else {
    document.documentElement.removeAttribute("data-theme-variant");
  }
};

export const getThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
};

export const setThemePreference = (pref: ThemePreference) => {
  localStorage.setItem(THEME_KEY, pref);
  applyThemePreference(pref);
  setupSystemListener(pref);
};

export const setThemeVariant = (variant: ThemeVariant) => {
  localStorage.setItem(VARIANT_KEY, variant);
  applyThemeVariant(variant);
};

const setupSystemListener = (pref: ThemePreference) => {
  if (!systemMedia) systemMedia = window.matchMedia("(prefers-color-scheme: dark)");
  if (systemListener) systemMedia.removeEventListener("change", systemListener);
  if (pref === "system") {
    systemListener = (e) => {
      const theme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      setThemeColorMeta(theme);
    };
    systemMedia.addEventListener("change", systemListener);
  } else {
    systemListener = null;
  }
};

export const initTheme = (): ThemePreference => {
  const pref = getThemePreference();
  applyThemePreference(pref);
  setupSystemListener(pref);
  applyThemeVariant(getThemeVariant());
  return pref;
};
