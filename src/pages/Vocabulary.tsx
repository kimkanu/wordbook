import { createSignal, For, Show, createMemo } from "solid-js";
import { getDb } from "~/db";
import { words } from "~/db/schema";
import { eq } from "drizzle-orm";

interface VocabEntry {
  word: string;
  definition: string;
  pronunciation: string;
  etymology: string;
  englishCognates: string;
  synonyms: string;
  antonyms: string;
  exampleSentence: string;
  category: string;
}

const CURATED_VOCAB: VocabEntry[] = [
  {
    word: "ameliorer",
    definition: "Rendre meilleur, apporter des modifications positives",
    pronunciation: "/a.me.ljɔ.ʁe/",
    etymology: "From Old French 'ameillorer', from Latin 'melior' (better)",
    englishCognates: "ameliorate, meliorate",
    synonyms: "perfectionner, bonifier, progresser",
    antonyms: "empirer, aggraver, deteriorer",
    exampleSentence: "Il faut ameliorer nos conditions de travail.",
    category: "verbs",
  },
  {
    word: "bouleverser",
    definition: "Troubler profondement, mettre en desordre complet",
    pronunciation: "/bul.vɛʁ.se/",
    etymology: "From 'boule' + 'verser' (to overturn), literally 'to bowl over'",
    englishCognates: "bouleversement (used in English literary criticism)",
    synonyms: "chambouler, ebranler, perturber",
    antonyms: "stabiliser, rassurer, calmer",
    exampleSentence: "Cette nouvelle a bouleverse toute la famille.",
    category: "verbs",
  },
  {
    word: "epanouir",
    definition: "Faire s'ouvrir (une fleur); rendre heureux, permettre le developpement",
    pronunciation: "/e.pa.nwiʁ/",
    etymology: "From Old French 'espanir', from Frankish *spannan (to stretch, unfold)",
    englishCognates: "span (distant cognate via Germanic root)",
    synonyms: "fleurir, eclore, s'accomplir",
    antonyms: "fletrir, se faner, deperir",
    exampleSentence: "Elle s'est epanouie dans son nouveau metier.",
    category: "verbs",
  },
  {
    word: "tergiverser",
    definition: "User de faux-fuyants, hesiter, eviter de prendre position",
    pronunciation: "/tɛʁ.ʒi.vɛʁ.se/",
    etymology: "From Latin 'tergiversari' (to turn one's back), from 'tergum' (back) + 'versare' (to turn)",
    englishCognates: "tergiversate, tergiversation",
    synonyms: "atermoyer, louvoyer, temporiser",
    antonyms: "decider, trancher, se prononcer",
    exampleSentence: "Arretez de tergiverser et prenez une decision!",
    category: "verbs",
  },
  {
    word: "acquiescer",
    definition: "Donner son consentement, approuver en acceptant",
    pronunciation: "/a.kje.se/",
    etymology: "From Latin 'acquiescere' (to find rest in), from 'ad-' + 'quiescere' (to rest)",
    englishCognates: "acquiesce, acquiescence, quiescent",
    synonyms: "consentir, approuver, accepter",
    antonyms: "refuser, s'opposer, contester",
    exampleSentence: "Il a acquiesce d'un signe de tete.",
    category: "verbs",
  },
  {
    word: "ebaucher",
    definition: "Donner une premiere forme, tracer les grandes lignes",
    pronunciation: "/e.bo.ʃe/",
    etymology: "From Old French 'esbochier', from 'es-' (out) + 'boche/bosc' (wood), literally to rough-hew wood",
    englishCognates: "no direct cognate (but 'debouch' shares the root)",
    synonyms: "esquisser, amorcer, entamer",
    antonyms: "achever, parfaire, peaufiner",
    exampleSentence: "L'artiste a ebauche un portrait au fusain.",
    category: "verbs",
  },
  {
    word: "conciliant",
    definition: "Dispose a s'entendre, a faire des concessions",
    pronunciation: "/kɔ̃.si.ljɑ̃/",
    etymology: "From Latin 'conciliare' (to bring together, unite)",
    englishCognates: "conciliatory, conciliate, reconcile",
    synonyms: "accommodant, arrangeant, complaisant",
    antonyms: "intransigeant, inflexible, intraitable",
    exampleSentence: "Mon patron est conciliant sur les horaires.",
    category: "adjectives",
  },
  {
    word: "perspicace",
    definition: "Qui a une intelligence penetrante, capable de discerner ce qui echappe aux autres",
    pronunciation: "/pɛʁ.spi.kas/",
    etymology: "From Latin 'perspicax' (sharp-sighted), from 'perspicere' (to look through)",
    englishCognates: "perspicacious, perspicacity",
    synonyms: "clairvoyant, sagace, lucide",
    antonyms: "naif, obtus, borne",
    exampleSentence: "C'est un observateur perspicace de la nature humaine.",
    category: "adjectives",
  },
  {
    word: "ineluctable",
    definition: "Qui ne peut etre evite, contre quoi on ne peut lutter",
    pronunciation: "/i.ne.lyk.tabl/",
    etymology: "From Latin 'ineluctabilis', from 'in-' (not) + 'eluctari' (to struggle out of)",
    englishCognates: "ineluctable",
    synonyms: "inevitable, inexorable, implacable",
    antonyms: "evitable, incertain, contingent",
    exampleSentence: "La progression de la technologie est ineluctable.",
    category: "adjectives",
  },
  {
    word: "eblouissant",
    definition: "Qui eblouit par son eclat; qui frappe d'admiration",
    pronunciation: "/e.blu.i.sɑ̃/",
    etymology: "From Old French 'esblouir', possibly from Frankish *blausjan (to blind)",
    englishCognates: "no direct cognate (but related to 'blind' via Germanic roots)",
    synonyms: "eclatant, resplendissant, fulgurant",
    antonyms: "terne, fade, mediocre",
    exampleSentence: "Le coucher de soleil etait eblouissant.",
    category: "adjectives",
  },
  {
    word: "ephemere",
    definition: "Qui est de courte duree, qui ne dure pas",
    pronunciation: "/e.fe.mɛʁ/",
    etymology: "From Greek 'ephemeros' (lasting but a day), from 'epi' (on) + 'hemera' (day)",
    englishCognates: "ephemeral, ephemera, ephemeris",
    synonyms: "passager, fugace, transitoire",
    antonyms: "durable, permanent, eternel",
    exampleSentence: "Le bonheur est souvent ephemere.",
    category: "adjectives",
  },
  {
    word: "vraisemblable",
    definition: "Qui a l'apparence de la verite, qui semble vrai",
    pronunciation: "/vʁɛ.sɑ̃.blabl/",
    etymology: "From 'vrai' (true) + 'semblable' (similar), calque of Latin 'verisimilis'",
    englishCognates: "verisimilar, verisimilitude",
    synonyms: "plausible, credible, probable",
    antonyms: "invraisemblable, improbable, inconcevable",
    exampleSentence: "Son explication n'est guere vraisemblable.",
    category: "adjectives",
  },
  {
    word: "redhibitoire",
    definition: "Qui constitue un obstacle radical, un empechement absolu",
    pronunciation: "/ʁe.di.bi.twaʁ/",
    etymology: "From Latin 'redhibitorius', from 'redhibere' (to take back), legal term for a defect justifying return",
    englishCognates: "redhibitory (legal term)",
    synonyms: "eliminatoire, prohibitif, disqualifiant",
    antonyms: "acceptable, tolerable, surmontable",
    exampleSentence: "Son manque d'experience n'est pas redhibitoire.",
    category: "adjectives",
  },
  {
    word: "ubiquiste",
    definition: "Qui se trouve ou semble se trouver partout en meme temps",
    pronunciation: "/y.bi.kist/",
    etymology: "From Latin 'ubique' (everywhere)",
    englishCognates: "ubiquitous, ubiquity",
    synonyms: "omnipresent, universel",
    antonyms: "localise, rare, circonscrit",
    exampleSentence: "La technologie est devenue ubiquiste dans notre quotidien.",
    category: "adjectives",
  },
  {
    word: "engouement",
    definition: "Admiration vive et soudaine, enthousiasme excessif et passager",
    pronunciation: "/ɑ̃.ɡu.mɑ̃/",
    etymology: "From 'engouer' (to obstruct the throat, be infatuated), from 'en-' + 'goue' (throat)",
    englishCognates: "no direct cognate",
    synonyms: "enthousiasme, emballement, passion",
    antonyms: "desinteret, indifference, detachement",
    exampleSentence: "L'engouement pour cette mode est retombe.",
    category: "nouns",
  },
  {
    word: "abnegation",
    definition: "Sacrifice de soi-meme, renoncement a ses propres interets",
    pronunciation: "/ab.ne.ɡa.sjɔ̃/",
    etymology: "From Latin 'abnegatio' (denial), from 'abnegare' (to deny)",
    englishCognates: "abnegation, self-abnegation",
    synonyms: "devouement, sacrifice, renoncement",
    antonyms: "egoisme, individualisme, egocentrisme",
    exampleSentence: "Les pompiers font preuve d'une grande abnegation.",
    category: "nouns",
  },
  {
    word: "insouciance",
    definition: "Etat d'esprit de celui qui ne se soucie de rien, legerete",
    pronunciation: "/ɛ̃.su.sjɑ̃s/",
    etymology: "From 'in-' (not) + 'souciance' (caring), from 'soucier' (to worry), from Latin 'sollicitare'",
    englishCognates: "insouciance, insouciant",
    synonyms: "nonchalance, desinvolture, legerete",
    antonyms: "inquietude, anxiete, preoccupation",
    exampleSentence: "Il vit avec une insouciance qui inquiete ses parents.",
    category: "nouns",
  },
  {
    word: "resipiscence",
    definition: "Reconnaissance de sa faute avec amendement, retour au bon sens",
    pronunciation: "/ʁe.si.pi.sɑ̃s/",
    etymology: "From Latin 'resipiscentia', from 'resipiscere' (to come to one's senses), from 're-' + 'sapere' (to know)",
    englishCognates: "resipiscence (rare English literary word)",
    synonyms: "repentir, contrition, amendement",
    antonyms: "entetement, obstination, impenitence",
    exampleSentence: "Apres des annees d'erreurs, il est venu a resipiscence.",
    category: "nouns",
  },
  {
    word: "pusillanimite",
    definition: "Manque de courage, de determination; timidite excessive",
    pronunciation: "/py.zi.la.ni.mi.te/",
    etymology: "From Latin 'pusillanimitas', from 'pusillus' (very small) + 'animus' (spirit)",
    englishCognates: "pusillanimous, pusillanimity",
    synonyms: "lachete, couardise, pleutrerie",
    antonyms: "courage, bravoure, intrepidite",
    exampleSentence: "Sa pusillanimite l'empeche de prendre des risques.",
    category: "nouns",
  },
  {
    word: "outrecuidance",
    definition: "Confiance excessive en soi-meme, presomption insolente",
    pronunciation: "/u.tʁə.kɥi.dɑ̃s/",
    etymology: "From Old French 'outrecuidier' (to think too highly of oneself), from 'outre' (beyond) + 'cuidier' (to think, from Latin 'cogitare')",
    englishCognates: "no direct cognate (but 'cogitate' shares the Latin root)",
    synonyms: "presomption, arrogance, suffisance",
    antonyms: "humilite, modestie, reserve",
    exampleSentence: "Il a eu l'outrecuidance de contredire le professeur.",
    category: "nouns",
  },
  {
    word: "a bon escient",
    definition: "De facon judicieuse, a juste titre, en connaissance de cause",
    pronunciation: "/a bɔ̃.n‿ɛs.sjɑ̃/",
    etymology: "From Old French 'escient' (knowledge), from Latin 'sciens' (knowing), from 'scire' (to know)",
    englishCognates: "science, prescient, omniscient (from same Latin root 'scire')",
    synonyms: "judicieusement, a propos, pertinemment",
    antonyms: "a tort, inconsiderement, maladroitement",
    exampleSentence: "Il faut utiliser ces ressources a bon escient.",
    category: "phrases",
  },
  {
    word: "avoir maille a partir",
    definition: "Avoir un differend, etre en conflit avec quelqu'un",
    pronunciation: "/a.vwaʁ maj a paʁ.tiʁ/",
    etymology: "From 'maille' (smallest coin in medieval France) + 'partir' (to divide). Originally meant unable to split the smallest coin fairly",
    englishCognates: "no direct cognate",
    synonyms: "se quereller, se disputer, etre en desaccord",
    antonyms: "s'entendre, cooperer, fraterniser",
    exampleSentence: "J'ai eu maille a partir avec l'administration.",
    category: "phrases",
  },
  {
    word: "faire fi de",
    definition: "Mepriser, ne faire aucun cas de quelque chose",
    pronunciation: "/fɛʁ fi də/",
    etymology: "From 'fi', interjection of disdain from Latin 'fi' (an exclamation of disgust)",
    englishCognates: "no direct cognate",
    synonyms: "dedaigner, negliger, ignorer",
    antonyms: "respecter, considerer, valoriser",
    exampleSentence: "Il fait fi des conventions sociales.",
    category: "phrases",
  },
  {
    word: "de prime abord",
    definition: "Au premier contact, a premiere vue, des le debut",
    pronunciation: "/də pʁim a.bɔʁ/",
    etymology: "From 'prime' (first, from Latin 'primus') + 'abord' (approach, from 'aborder')",
    englishCognates: "prime, primary (from same Latin 'primus')",
    synonyms: "a premiere vue, au premier coup d'oeil, d'emblee",
    antonyms: "a la reflexion, en y regardant de plus pres",
    exampleSentence: "De prime abord, le probleme semble simple.",
    category: "phrases",
  },
];

export default function VocabularyPage() {
  const [filter, setFilter] = createSignal<string>("all");
  const [addedWords, setAddedWords] = createSignal<Set<string>>(new Set());
  const [adding, setAdding] = createSignal<string | null>(null);

  const categories = createMemo(() => {
    const cats = [...new Set(CURATED_VOCAB.map((v) => v.category))];
    return cats.sort();
  });

  const filtered = createMemo(() => {
    if (filter() === "all") return CURATED_VOCAB;
    return CURATED_VOCAB.filter((v) => v.category === filter());
  });

  async function handleAddToWordbook(entry: VocabEntry) {
    setAdding(entry.word);
    const db = await getDb();

    const existing = await db
      .select({ id: words.id })
      .from(words)
      .where(eq(words.word, entry.word));

    if (existing.length === 0) {
      await db.insert(words).values({
        word: entry.word,
        definition: entry.definition,
        pronunciation: entry.pronunciation,
        etymology: entry.etymology,
        englishCognates: entry.englishCognates,
        synonyms: entry.synonyms,
        antonyms: entry.antonyms,
        exampleSentence: entry.exampleSentence,
      });
    }

    setAddedWords((prev) => new Set([...prev, entry.word]));
    setAdding(null);
  }

  async function handleAddAll() {
    const db = await getDb();
    const entries = filtered();
    for (const entry of entries) {
      if (addedWords().has(entry.word)) continue;

      const existing = await db
        .select({ id: words.id })
        .from(words)
        .where(eq(words.word, entry.word));

      if (existing.length === 0) {
        await db.insert(words).values({
          word: entry.word,
          definition: entry.definition,
          pronunciation: entry.pronunciation,
          etymology: entry.etymology,
          englishCognates: entry.englishCognates,
          synonyms: entry.synonyms,
          antonyms: entry.antonyms,
          exampleSentence: entry.exampleSentence,
        });
      }

      setAddedWords((prev) => new Set([...prev, entry.word]));
    }
  }

  return (
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Curated French Vocabulary
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Difficult words and phrases with etymology, cognates, and more
          </p>
        </div>
        <button
          onClick={handleAddAll}
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
        >
          Add All to Wordbook
        </button>
      </div>

      {/* Category Filter */}
      <div class="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            filter() === "all"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          All ({CURATED_VOCAB.length})
        </button>
        <For each={categories()}>
          {(cat) => (
            <button
              onClick={() => setFilter(cat)}
              class={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                filter() === cat
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {cat} ({CURATED_VOCAB.filter((v) => v.category === cat).length})
            </button>
          )}
        </For>
      </div>

      {/* Vocabulary Cards */}
      <div class="space-y-3">
        <For each={filtered()}>
          {(entry) => {
            const isAdded = () => addedWords().has(entry.word);
            const isAdding = () => adding() === entry.word;

            return (
              <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 transition-colors">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-base font-bold text-gray-900 dark:text-gray-100">
                        {entry.word}
                      </h3>
                      <span class="text-xs text-gray-400 dark:text-gray-500">
                        {entry.pronunciation}
                      </span>
                      <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full capitalize">
                        {entry.category}
                      </span>
                    </div>
                    <p class="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {entry.definition}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToWordbook(entry)}
                    disabled={isAdded() || isAdding()}
                    class={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isAdded()
                        ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                    }`}
                  >
                    {isAdded() ? "Added" : isAdding() ? "Adding..." : "Add to Wordbook"}
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                    <span class="font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1">
                      Etymology
                    </span>
                    <span class="text-gray-700 dark:text-gray-300">{entry.etymology}</span>
                  </div>
                  <div class="bg-indigo-50 dark:bg-indigo-950/50 rounded-lg p-3">
                    <span class="font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                      English Cognates
                    </span>
                    <span class="text-indigo-700 dark:text-indigo-300">{entry.englishCognates}</span>
                  </div>
                  <div class="bg-emerald-50 dark:bg-emerald-950/50 rounded-lg p-3">
                    <span class="font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                      Synonyms
                    </span>
                    <span class="text-emerald-700 dark:text-emerald-300">{entry.synonyms}</span>
                  </div>
                  <div class="bg-rose-50 dark:bg-rose-950/50 rounded-lg p-3">
                    <span class="font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                      Antonyms
                    </span>
                    <span class="text-rose-700 dark:text-rose-300">{entry.antonyms}</span>
                  </div>
                </div>

                <p class="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">
                  "{entry.exampleSentence}"
                </p>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}
