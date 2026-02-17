import { createSignal, createResource, For, Show, createMemo } from "solid-js";
import { A } from "@solidjs/router";
import { getDb } from "~/db";
import { words, articles, wordTags, tags } from "~/db/schema";
import { desc, eq, like, ilike, count } from "drizzle-orm";

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
          item.articleTitle?.toLowerCase().includes(query),
      );
    }

    if (statusFilter() !== "all") {
      list = list.filter((item) => item.word.status === statusFilter());
    }

    if (sortBy() === "alpha") {
      list = [...list].sort((a, b) =>
        a.word.word.localeCompare(b.word.word),
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
    learning: "bg-amber-50 text-amber-700 border-amber-200",
    reviewing: "bg-blue-50 text-blue-700 border-blue-200",
    mastered: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div class="space-y-6">
      {/* Search & Filters */}
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search words, definitions, sources..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={statusFilter()}
          onChange={(e) => setStatusFilter(e.currentTarget.value)}
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Newest first</option>
          <option value="alpha">A - Z</option>
        </select>
      </div>

      {/* Word Count */}
      <p class="text-xs text-gray-400">
        {filteredWords().length} word{filteredWords().length !== 1 ? "s" : ""}
        <Show when={search() || statusFilter() !== "all"}>
          {" "}
          (filtered from {wordList()?.length ?? 0})
        </Show>
      </p>

      {/* Word List */}
      <Show
        when={!wordList.loading}
        fallback={<p class="text-sm text-gray-400">Loading...</p>}
      >
        <Show
          when={filteredWords().length > 0}
          fallback={
            <div class="text-center py-12">
              <p class="text-gray-400 text-sm">
                {search() || statusFilter() !== "all"
                  ? "No words match your filters."
                  : "No words saved yet. Add some from the Articles page."}
              </p>
            </div>
          }
        >
          <div class="space-y-2">
            <For each={filteredWords()}>
              {(item) => (
                <div class="bg-white rounded-lg border border-gray-200 px-4 py-3 group">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <A
                          href={`/words/${item.word.id}`}
                          class="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {item.word.word}
                        </A>
                        <Show when={item.word.pronunciation}>
                          <span class="text-xs text-gray-400">
                            {item.word.pronunciation}
                          </span>
                        </Show>
                      </div>
                      <Show when={item.word.definition}>
                        <p class="text-sm text-gray-600 mb-1">
                          {item.word.definition}
                        </p>
                      </Show>
                      <div class="flex items-center gap-2 text-xs text-gray-400">
                        <Show when={item.articleTitle}>
                          <span>Source: {item.articleTitle}</span>
                        </Show>
                        <Show when={item.tags.length > 0}>
                          <For each={item.tags}>
                            {(tag) => (
                              <span class="text-blue-500">#{tag}</span>
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
                        class="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs"
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
