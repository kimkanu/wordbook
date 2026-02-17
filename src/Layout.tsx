import { type ParentProps } from "solid-js";
import { A } from "@solidjs/router";
import { isDark, toggleDark } from "~/darkMode";

export default function Layout(props: ParentProps) {
  return (
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <nav class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10 transition-colors">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="flex items-center justify-between h-14">
            <A
              href="/"
              class="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight"
            >
              French Wordbook
            </A>
            <div class="flex items-center gap-1">
              <A
                href="/"
                class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                activeClass="!text-blue-600 dark:!text-blue-400 !bg-blue-50 dark:!bg-blue-950"
                end
              >
                Texts
              </A>
              <A
                href="/words"
                class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                activeClass="!text-blue-600 dark:!text-blue-400 !bg-blue-50 dark:!bg-blue-950"
              >
                Words
              </A>
              <A
                href="/vocabulary"
                class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                activeClass="!text-blue-600 dark:!text-blue-400 !bg-blue-50 dark:!bg-blue-950"
              >
                Vocabulary
              </A>
              <button
                onClick={toggleDark}
                class="ml-2 p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={isDark() ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark() ? (
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={2}>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width={2}>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main class="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {props.children}
      </main>
    </div>
  );
}
