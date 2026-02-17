import { createSignal, createResource, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { getDb } from "~/db";
import { words, articles, wordTags, tags } from "~/db/schema";
import { desc, eq } from "drizzle-orm";

async function fetchWords() {
  const db = await getDb();
  const result = await db
    .select({
      word: words,
      articleTitle: articles.title,
    })
    .from(words)
    .leftJoin(articles, eq(words.articleId, articles.id))
    .orderBy(desc(words.createdAt));

  // Fetch tags for each word
  const wordIds = result.map((r) => r.word.id);
  const tagResults =
    wordIds.length > 0
      ? await db
          .select({
            wordId: wordTags.wordId,
            tagName: tags.name,
          })
          .from(wordTags)
          .innerJoin(tags, eq(wordTags.tagId, tags.id))
      : [];

  const tagMap = new Map<number, string[]>();
  for (const t of tagResults) {
    if (!tagMap.has(t.wordId)) tagMap.set(t.wordId, []);
    tagMap.get(t.wordId)!.push(t.tagName);
  }

  return result.map((r) => ({
    ...r,
    tags: tagMap.get(r.word.id) ?? [],
  }));
}

export default function WordsPage() {
  const [wordList, { refetch }] = createResource(fetchWords);
  const [search, setSearch] = createSignal("");
  const [statusFilter, setStatusFilter] = createSignal<string>("all");
  const [sortBy, setSortBy] = createSignal<"date" | "alpha">("date");

  const filteredWords = createMemo(() => {
    let list = wordList() ?? [];
    const query = search().toLowerCase();

    if (query) {
      list = list.filter(
        (item) =>
          item.word.word.toLowerCase().includes(query) ||
          item.word.definition?.toLowerCase().includes(query) ||
          item.word.etymology?.toLowerCase().includes(query) ||
          item.word.englishCognates?.toLowerCase().includes(query) ||
          item.word.synonyms?.toLowerCase().includes(query) ||
          item.articleTitle?.toLowerCase().includes(query),
      );
    }

    if (statusFilter() !== "all") {
      list = list.filter((item) => item.word.status === statusFilter());
    }

    if (sortBy() === "alpha") {
      list = [...list].sort((a, b) =>
        a.word.word.localeCompare(b.word.word, "fr"),
      );
    }

    return list;
  });

  async function handleDelete(id: number) {
    const db = await getDb();
    await db.delete(words).where(eq(words.id, id));
    refetch();
  }

  async function handleStatusChange(id: number, newStatus: string) {
    const db = await getDb();
    await db
      .update(words)
      .set({ status: newStatus as "learning" | "reviewing" | "mastered" })
      .where(eq(words.id, id));
    refetch();
  }

  const statusColors: Record<string, string> = {
    learning:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
    reviewing:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
    mastered:
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800",
  };

  return (
    <div class="space-y-6">
      {/* Search & Filters */}
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search words, definitions, etymology..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter()}
          onChange={(e) => setStatusFilter(e.currentTarget.value)}
          class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="learning">Learning</option>
          <option value="reviewing">Reviewing</option>
          <option value="mastered">Mastered</option>
        </select>
        <select
          value={sortBy()}
          onChange={(e) =>
            setSortBy(e.currentTarget.value as "date" | "alpha")
          }
          class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Newest first</option>
          <option value="alpha">A - Z</option>
        </select>
      </div>

      {/* Word Count */}
      <p class="text-xs text-gray-400 dark:text-gray-500">
        {filteredWords().length} word{filteredWords().length !== 1 ? "s" : ""}
        <Show when={search() || statusFilter() !== "all"}>
          {" "}
          (filtered from {wordList()?.length ?? 0})
        </Show>
      </p>

      {/* Word List */}
      <Show
        when={!wordList.loading}
        fallback={<p class="text-sm text-gray-400 dark:text-gray-500">Loading...</p>}
      >
        <Show
          when={filteredWords().length > 0}
          fallback={
            <div class="text-center py-12">
              <p class="text-gray-400 dark:text-gray-500 text-sm">
                {search() || statusFilter() !== "all"
                  ? "No words match your filters."
                  : "No words saved yet. Add some from the Texts page or browse the Vocabulary list."}
              </p>
            </div>
          }
        >
          <div class="space-y-2">
            <For each={filteredWords()}>
              {(item) => (
                <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3 group transition-colors">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <A
                          href={`/words/${item.word.id}`}
                          class="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {item.word.word}
                        </A>
                        <Show when={item.word.pronunciation}>
                          <span class="text-xs text-gray-400 dark:text-gray-500">
                            {item.word.pronunciation}
                          </span>
                        </Show>
                      </div>
                      <Show when={item.word.definition}>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {item.word.definition}
                        </p>
                      </Show>
                      <Show when={item.word.englishCognates}>
                        <p class="text-xs text-indigo-600 dark:text-indigo-400 mb-1">
                          English cognates: {item.word.englishCognates}
                        </p>
                      </Show>
                      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
                        <Show when={item.word.synonyms}>
                          <span class="text-emerald-600 dark:text-emerald-400">
                            Syn: {item.word.synonyms}
                          </span>
                        </Show>
                        <Show when={item.word.antonyms}>
                          <span class="text-rose-500 dark:text-rose-400">
                            Ant: {item.word.antonyms}
                          </span>
                        </Show>
                        <Show when={item.articleTitle}>
                          <span>Source: {item.articleTitle}</span>
                        </Show>
                        <Show when={item.tags.length > 0}>
                          <For each={item.tags}>
                            {(tag) => (
                              <span class="text-blue-500 dark:text-blue-400">#{tag}</span>
                            )}
                          </For>
                        </Show>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <select
                        value={item.word.status}
                        onChange={(e) =>
                          handleStatusChange(
                            item.word.id,
                            e.currentTarget.value,
                          )
                        }
                        class={`text-xs px-2 py-1 rounded-md border font-medium ${statusColors[item.word.status]} focus:outline-none`}
                      >
                        <option value="learning">Learning</option>
                        <option value="reviewing">Reviewing</option>
                        <option value="mastered">Mastered</option>
                      </select>
                      <button
                        onClick={() => handleDelete(item.word.id)}
                        class="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
