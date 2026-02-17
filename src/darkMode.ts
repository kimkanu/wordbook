import { createSignal } from "solid-js";

function getInitialDark(): boolean {
  const stored = localStorage.getItem("wordbook-dark-mode");
  if (stored !== null) return stored === "true";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

const [isDark, setIsDarkRaw] = createSignal(getInitialDark());

// Apply immediately on load
if (isDark()) {
  document.documentElement.classList.add("dark");
}

function setIsDark(value: boolean) {
  setIsDarkRaw(value);
  localStorage.setItem("wordbook-dark-mode", String(value));
  if (value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

function toggleDark() {
  setIsDark(!isDark());
}

export { isDark, toggleDark };
