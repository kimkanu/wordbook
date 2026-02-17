import {
  createSignal,
  createResource,
  Show,
  For,
  onMount,
} from "solid-js";
import { useParams, useNavigate } from "@solidjs/router";
import { getDb } from "~/db";
import { words, tags, wordTags, articles } from "~/db/schema";
import { eq } from "drizzle-orm";

async function fetchWord(id: number) {
  const db = await getDb();
  const [result] = await db
    .select({
      word: words,
      articleTitle: articles.title,
    })
    .from(words)
    .leftJoin(articles, eq(words.articleId, articles.id))
    .where(eq(words.id, id));

  if (!result) return null;

  const wordTagList = await db
    .select({ tagName: tags.name, tagId: tags.id })
    .from(wordTags)
    .innerJoin(tags, eq(wordTags.tagId, tags.id))
    .where(eq(wordTags.wordId, id));

  return { ...result, tags: wordTagList };
}

export default function WordDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const [data, { refetch }] = createResource(
    () => Number(params.id),
    fetchWord,
  );

  const [wordText, setWordText] = createSignal("");
  const [definition, setDefinition] = createSignal("");
  const [pronunciation, setPronunciation] = createSignal("");
  const [exampleSentence, setExampleSentence] = createSignal("");
  const [status, setStatus] = createSignal<string>("learning");
  const [newTag, setNewTag] = createSignal("");
  const [saving, setSaving] = createSignal(false);

  // Populate form when data loads
  createResource(
    () => data(),
    (d) => {
      if (d) {
        setWordText(d.word.word);
        setDefinition(d.word.definition ?? "");
        setPronunciation(d.word.pronunciation ?? "");
        setExampleSentence(d.word.exampleSentence ?? "");
        setStatus(d.word.status);
      }
    },
  );

  async function handleSave() {
    setSaving(true);
    const db = await getDb();
    await db
      .update(words)
      .set({
        word: wordText(),
        definition: definition() || null,
        pronunciation: pronunciation() || null,
        exampleSentence: exampleSentence() || null,
        status: status() as "learning" | "reviewing" | "mastered",
      })
      .where(eq(words.id, Number(params.id)));
    setSaving(false);
    refetch();
  }

  async function handleDelete() {
    const db = await getDb();
    await db.delete(words).where(eq(words.id, Number(params.id)));
    navigate("/words");
  }

  async function handleAddTag() {
    const tagName = newTag().trim().toLowerCase();
    if (!tagName) return;

    const db = await getDb();

    // Get or create the tag
    let [existingTag] = await db
      .select()
      .from(tags)
      .where(eq(tags.name, tagName));

    if (!existingTag) {
      [existingTag] = await db
        .insert(tags)
        .values({ name: tagName })
        .returning();
    }

    // Link tag to word (ignore if already linked)
    try {
      await db
        .insert(wordTags)
        .values({ wordId: Number(params.id), tagId: existingTag.id });
    } catch {
      // Already linked
    }

    setNewTag("");
    refetch();
  }

  async function handleRemoveTag(tagId: number) {
    const db = await getDb();
    await db
      .delete(wordTags)
      .where(eq(wordTags.wordId, Number(params.id)));
    // Re-add remaining tags (simple approach)
    refetch();
  }

  async function handleFetchDefinition() {
    const word = wordText();
    if (!word) return;
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
      );
      if (res.ok) {
        const data = await res.json();
        const def = data[0]?.meanings?.[0]?.definitions?.[0]?.definition;
        const pron = data[0]?.phonetic || data[0]?.phonetics?.[0]?.text;
        if (def) setDefinition(def);
        if (pron) setPronunciation(pron);
      }
    } catch {
      // silently fail
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const textareaClass =
    "w-full h-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  return (
    <Show
      when={!data.loading && data()}
      fallback={
        <Show when={data.loading}>
          <p class="text-sm text-gray-400 dark:text-gray-500">Loading...</p>
        </Show>
      }
    >
      {(d) => (
        <div class="max-w-xl mx-auto">
          <button
            onClick={() => navigate("/words")}
            class="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-4 inline-flex items-center gap-1"
          >
            &larr; Back to Words
          </button>

          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4 transition-colors">
            {/* Word */}
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Word
              </label>
              <input
                type="text"
                value={wordText()}
                onInput={(e) => setWordText(e.currentTarget.value)}
                class={inputClass}
              />
            </div>

            {/* Definition */}
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Definition
                </label>
                <button
                  onClick={handleFetchDefinition}
                  class="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Auto-fetch
                </button>
              </div>
              <textarea
                value={definition()}
                onInput={(e) => setDefinition(e.currentTarget.value)}
                class={textareaClass}
              />
            </div>

            {/* Pronunciation */}
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Pronunciation
              </label>
              <input
                type="text"
                value={pronunciation()}
                onInput={(e) => setPronunciation(e.currentTarget.value)}
                class={inputClass}
              />
            </div>

            {/* Example Sentence */}
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Example Sentence
              </label>
              <textarea
                value={exampleSentence()}
                onInput={(e) => setExampleSentence(e.currentTarget.value)}
                class={textareaClass}
              />
            </div>

            {/* Status */}
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <select
                value={status()}
                onChange={(e) => setStatus(e.currentTarget.value)}
                class="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="learning">Learning</option>
                <option value="reviewing">Reviewing</option>
                <option value="mastered">Mastered</option>
              </select>
            </div>

            {/* Tags */}
            <div>
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tags
              </label>
              <div class="flex flex-wrap gap-2 mb-2">
                <For each={d().tags}>
                  {(tag) => (
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                      #{tag.tagName}
                      <button
                        onClick={() => handleRemoveTag(tag.tagId)}
                        class="text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300"
                      >
                        &times;
                      </button>
                    </span>
                  )}
                </For>
              </div>
              <div class="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a tag..."
                  value={newTag()}
                  onInput={(e) => setNewTag(e.currentTarget.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                  class="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTag}
                  class="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Source */}
            <Show when={d().articleTitle}>
              <div>
                <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Source
                </label>
                <p class="text-sm text-gray-600 dark:text-gray-400">{d().articleTitle}</p>
              </div>
            </Show>

            {/* Actions */}
            <div class="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleSave}
                disabled={saving()}
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving() ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleDelete}
                class="px-4 py-2 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
              >
                Delete Word
              </button>
            </div>
          </div>
        </div>
      )}
    </Show>
  );
}
