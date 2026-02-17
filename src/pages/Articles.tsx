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
    .replace(/[^a-zA-Z\s'-]/g, " ")
    .toLowerCase();
  const allWords = cleaned.split(/\s+/).filter((w) => w.length > 3);
  const unique = [...new Set(allWords)];
  // Filter out very common English words
  const stopWords = new Set([
    "that",
    "this",
    "with",
    "from",
    "have",
    "been",
    "were",
    "they",
    "their",
    "them",
    "then",
    "than",
    "what",
    "when",
    "where",
    "which",
    "while",
    "will",
    "would",
    "could",
    "should",
    "about",
    "after",
    "before",
    "between",
    "under",
    "over",
    "into",
    "through",
    "during",
    "each",
    "some",
    "other",
    "more",
    "most",
    "also",
    "just",
    "only",
    "very",
    "even",
    "back",
    "much",
    "many",
    "well",
    "such",
    "like",
    "make",
    "made",
    "know",
    "take",
    "come",
    "came",
    "does",
    "done",
    "going",
    "want",
    "said",
    "says",
    "here",
    "there",
    "these",
    "those",
    "being",
    "because",
    "still",
    "both",
    "need",
    "same",
    "first",
    "last",
    "long",
    "great",
    "good",
    "right",
    "look",
    "think",
    "every",
    "people",
    "your",
    "year",
    "years",
    "time",
    "work",
    "part",
    "help",
    "call",
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

    // Try to fetch definition from Free Dictionary API
    let definition: string | undefined;
    let pronunciation: string | undefined;
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      );
      if (res.ok) {
        const data = await res.json();
        definition = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        pronunciation = data[0]?.phonetic || data[0]?.phonetics?.[0]?.text;
      }
    } catch {
      // silently fail — user can add definition manually
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
      <section class="bg-white rounded-xl border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">
          Add an Article
        </h2>

        <div class="flex gap-2 mb-4">
          <button
            class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inputMode() === "text"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setInputMode("text")}
          >
            Paste Text
          </button>
          <button
            class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              inputMode() === "url"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setInputMode("url")}
          >
            From URL
          </button>
        </div>

        <input
          type="text"
          placeholder="Article title (optional)"
          value={titleInput()}
          onInput={(e) => setTitleInput(e.currentTarget.value)}
          class="w-full px-3 py-2 mb-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <Show when={inputMode() === "text"}>
          <textarea
            placeholder="Paste your article text here..."
            value={textInput()}
            onInput={(e) => setTextInput(e.currentTarget.value)}
            class="w-full h-40 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </Show>

        <Show when={inputMode() === "url"}>
          <input
            type="url"
            placeholder="https://example.com/article"
            class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled
          />
          <p class="text-xs text-gray-400 mt-1">
            URL import coming soon. Paste the article text for now.
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
            class="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {saving() ? "Saving..." : "Save Article"}
          </button>
        </div>
      </section>

      {/* Extracted Words */}
      <Show when={extractedWords().length > 0}>
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <h3 class="text-sm font-semibold text-gray-900 mb-3">
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
                        ? "bg-green-50 text-green-700 cursor-default"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
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
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Saved Articles
        </h3>
        <Show
          when={!articleList.loading}
          fallback={<p class="text-sm text-gray-400">Loading...</p>}
        >
          <Show
            when={articleList()?.length}
            fallback={
              <p class="text-sm text-gray-400">
                No articles yet. Paste some text above to get started.
              </p>
            }
          >
            <div class="space-y-2">
              <For each={articleList()}>
                {(item) => (
                  <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between group">
                    <div>
                      <p class="text-sm font-medium text-gray-900">
                        {item.article.title}
                      </p>
                      <p class="text-xs text-gray-400">
                        {item.wordCount} word{item.wordCount !== 1 ? "s" : ""}{" "}
                        saved &middot;{" "}
                        {new Date(
                          item.article.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteArticle(item.article.id)}
                      class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-sm"
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
