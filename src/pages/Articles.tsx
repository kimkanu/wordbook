import { createSignal, createResource, For, Show } from "solid-js";
import { getDb } from "~/db";
import { articles, words } from "~/db/schema";
import { desc, eq, count } from "drizzle-orm";
import type { Article } from "~/db/schema";

async function fetchArticles() {
  const db = await getDb();
  const result = await db
    .select({
      article: articles,
      wordCount: count(words.id),
    })
    .from(articles)
    .leftJoin(words, eq(words.articleId, articles.id))
    .groupBy(articles.id)
    .orderBy(desc(articles.createdAt));
  return result;
}

function extractWordsFromText(text: string): string[] {
  const cleaned = text
    .replace(/<[^>]*>/g, " ")
    .replace(/[^a-zA-ZÀ-ÿœŒæÆçÇ\s'-]/g, " ")
    .toLowerCase();
  const allWords = cleaned.split(/\s+/).filter((w) => w.length > 2);
  const unique = [...new Set(allWords)];
  // Filter out very common French words (articles, prepositions, pronouns, etc.)
  const stopWords = new Set([
    "les", "des", "une", "sur", "est", "sont", "dans",
    "par", "pour", "pas", "que", "qui", "aux", "avec",
    "son", "ses", "ont", "mais", "cette", "ces",
    "tout", "tous", "elle", "elles", "ils", "nous",
    "vous", "leur", "leurs", "mon", "ton", "nos", "vos",
    "mes", "tes", "lui", "moi", "toi", "soi",
    "plus", "bien", "peut", "fait", "dire", "comme",
    "sans", "chez", "sous", "vers", "dont", "donc",
    "entre", "aussi", "autre", "autres", "quand",
    "car", "ici", "peu", "trop", "rien",
    "encore", "toujours", "jamais", "alors", "ainsi",
    "tre", "avoir", "faire", "aller", "voir",
    "the", "and", "for", "that", "this", "with", "from",
    "have", "been", "were", "they", "their", "them",
  ]);
  return unique.filter((w) => !stopWords.has(w));
}

export default function ArticlesPage() {
  const [articleList, { refetch }] = createResource(fetchArticles);
  const [inputMode, setInputMode] = createSignal<"text" | "url">("text");
  const [textInput, setTextInput] = createSignal("");
  const [titleInput, setTitleInput] = createSignal("");
  const [extractedWords, setExtractedWords] = createSignal<string[]>([]);
  const [savedWords, setSavedWords] = createSignal<Set<string>>(new Set());
  const [saving, setSaving] = createSignal(false);
  const [currentArticleId, setCurrentArticleId] = createSignal<number | null>(
    null,
  );

  async function handleExtract() {
    const text = textInput();
    if (!text.trim()) return;

    const extracted = extractWordsFromText(text);
    setExtractedWords(extracted);

    // Check which words are already saved
    const db = await getDb();
    const existingWords = await db.select({ word: words.word }).from(words);
    const existingSet = new Set(existingWords.map((w) => w.word.toLowerCase()));
    setSavedWords(existingSet);
  }

  async function handleSaveArticle() {
    const text = textInput();
    const title = titleInput() || "Untitled Article";
    if (!text.trim()) return;

    setSaving(true);
    const db = await getDb();
    const [article] = await db
      .insert(articles)
      .values({ title, content: text })
      .returning();
    setCurrentArticleId(article.id);
    setSaving(false);
    refetch();
  }

  async function handleAddWord(word: string) {
    const db = await getDb();
    const articleId = currentArticleId();

    // Try to fetch definition from Free Dictionary API (French)
    let definition: string | undefined;
    let pronunciation: string | undefined;
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/fr/${word}`,
      );
      if (res.ok) {
        const data = await res.json();
        definition = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        pronunciation = data[0]?.phonetic || data[0]?.phonetics?.[0]?.text;
      }
    } catch {
      // silently fail -- user can add definition manually
    }

    await db.insert(words).values({
      word,
      definition: definition ?? null,
      pronunciation: pronunciation ?? null,
      articleId: articleId ?? null,
    });

    setSavedWords((prev) => new Set([...prev, word.toLowerCase()]));
  }

  async function handleDeleteArticle(id: number) {
    const db = await getDb();
    await db.delete(articles).where(eq(articles.id, id));
    refetch();
  }

  return (
    <div class="space-y-8">
      {/* Input Section */}
      <section class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Add a French Text
        </h2>

        <div class="flex gap-2 mb-4">
          <button
            class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inputMode() === "text"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setInputMode("text")}
          >
            Paste Text
          </button>
          <button
            class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inputMode() === "url"
                ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setInputMode("url")}
          >
            From URL
          </button>
        </div>

        <input
          type="text"
          placeholder="Title (optional)"
          value={titleInput()}
          onInput={(e) => setTitleInput(e.currentTarget.value)}
          class="w-full px-3 py-2 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <Show when={inputMode() === "text"}>
          <textarea
            placeholder="Paste your French text here..."
            value={textInput()}
            onInput={(e) => setTextInput(e.currentTarget.value)}
            class="w-full h-40 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </Show>

        <Show when={inputMode() === "url"}>
          <input
            type="url"
            placeholder="https://example.com/article"
            class="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            URL import coming soon. Paste the text for now.
          </p>
        </Show>

        <div class="flex gap-2 mt-4">
          <button
            onClick={handleExtract}
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Extract Words
          </button>
          <button
            onClick={handleSaveArticle}
            disabled={saving() || !textInput().trim()}
            class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving() ? "Saving..." : "Save Article"}
          </button>
        </div>
      </section>

      {/* Extracted Words */}
      <Show when={extractedWords().length > 0}>
        <section class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 transition-colors">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Extracted Words ({extractedWords().length})
          </h3>
          <div class="flex flex-wrap gap-2">
            <For each={extractedWords()}>
              {(word) => {
                const isSaved = () => savedWords().has(word.toLowerCase());
                return (
                  <button
                    onClick={() => !isSaved() && handleAddWord(word)}
                    disabled={isSaved()}
                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      isSaved()
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 cursor-default"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                    }`}
                  >
                    <span>{word}</span>
                    <span class="text-xs">{isSaved() ? "\u2713" : "+"}</span>
                  </button>
                );
              }}
            </For>
          </div>
        </section>
      </Show>

      {/* Saved Articles */}
      <section>
        <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Saved Texts
        </h3>
        <Show
          when={!articleList.loading}
          fallback={<p class="text-sm text-gray-400 dark:text-gray-500">Loading...</p>}
        >
          <Show
            when={articleList()?.length}
            fallback={
              <p class="text-sm text-gray-400 dark:text-gray-500">
                No texts yet. Paste some French text above to get started.
              </p>
            }
          >
            <div class="space-y-2">
              <For each={articleList()}>
                {(item) => (
                  <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between group transition-colors">
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.article.title}
                      </p>
                      <p class="text-xs text-gray-400 dark:text-gray-500">
                        {item.wordCount} word{item.wordCount !== 1 ? "s" : ""}{" "}
                        saved &middot;{" "}
                        {new Date(
                          item.article.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteArticle(item.article.id)}
                      class="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </section>
    </div>
  );
}
