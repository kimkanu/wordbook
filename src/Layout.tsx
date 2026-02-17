import { type ParentProps } from "solid-js";
import { A } from "@solidjs/router";

export default function Layout(props: ParentProps) {
  return (
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div class="max-w-4xl mx-auto px-4 sm:px-6">
          <div class="flex items-center justify-between h-14">
            <A
              href="/"
              class="text-lg font-bold text-gray-900 tracking-tight"
            >
              Wordbook
            </A>
            <div class="flex gap-1">
              <A
                href="/"
                class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                activeClass="!text-blue-600 !bg-blue-50"
                end
              >
                Articles
              </A>
              <A
                href="/words"
                class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                activeClass="!text-blue-600 !bg-blue-50"
              >
                Words
              </A>
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
