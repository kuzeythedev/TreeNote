"use client";

import {
  Bot,
  CheckSquare,
  ClipboardList,
  Circle,
  FileText,
  Files,
  FolderKanban,
  Heading1,
  Languages,
  Lightbulb,
  LogOut,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Settings,
  Table2,
  Trash2,
  UserRound,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Locale = "tr" | "en";
type Theme = "light" | "dark";
type ActiveView = "notes" | "templates";
type BlockType = "paragraph" | "heading" | "todo" | "list";
type TemplateId =
  | "emptyPage"
  | "emptyDatabase"
  | "buildWithAi"
  | "tasks"
  | "projects"
  | "docs"
  | "brainstorm";

type NoteBlock = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  checkedLines?: boolean[];
};

type NotePage = {
  id: string;
  title: string;
  emoji: string;
  updatedAt: string;
  blocks: NoteBlock[];
};

type Translation = {
  appSubtitle: string;
  newPage: string;
  searchPlaceholder: string;
  saved: string;
  newNotePlaceholder: string;
  emptyTitle: string;
  emptyBody: string;
  settings: string;
  language: string;
  theme: string;
  lightTheme: string;
  darkTheme: string;
  turkish: string;
  english: string;
  localeHint: string;
  selectEmoji: string;
  writeEmoji: string;
  deletePage: string;
  addBlock: string;
  addBlockEnd: string;
  deleteBlock: string;
  toggleBlock: string;
  blockPlaceholder: Record<BlockType, string>;
  blockLabel: Record<BlockType, string>;
  blockDescription: Record<BlockType, string>;
  authTitle: string;
  authBody: string;
  email: string;
  password: string;
  signIn: string;
  signUp: string;
  signingIn: string;
  signingUp: string;
  needAccount: string;
  haveAccount: string;
  signOut: string;
  account: string;
  authConfigTitle: string;
  authConfigBody: string;
  authSuccess: string;
};

const translations: Record<Locale, Translation> = {
  tr: {
    appSubtitle: "Web MVP",
    newPage: "Yeni sayfa",
    searchPlaceholder: "Sayfalarda ara",
    saved: "Kaydedildi",
    newNotePlaceholder: "Yeni not",
    emptyTitle: "Henüz not yok",
    emptyBody: "Yeni bir sayfa oluşturup boş bir notla başlayabilirsin.",
    settings: "Ayarlar",
    language: "Dil",
    theme: "Tema",
    lightTheme: "Açık",
    darkTheme: "Koyu",
    turkish: "Türkçe",
    english: "İngilizce",
    localeHint: "Tarih, arama ve arayüz metinleri seçilen dile göre çalışır.",
    selectEmoji: "Emoji seç",
    writeEmoji: "Emoji yaz",
    deletePage: "Sayfayı sil",
    addBlock: "Yazmaya başla",
    addBlockEnd: "Sayfa sonuna blok ekle",
    deleteBlock: "Bloğu sil",
    toggleBlock: "Blok durumunu değiştir",
    blockPlaceholder: {
      paragraph: "Bir şeyler yaz",
      heading: "Başlık yaz",
      todo: "Yapılacak iş",
      list: "Yeni madde",
    },
    blockLabel: {
      paragraph: "Metin",
      heading: "Başlık",
      todo: "Todo",
      list: "Liste",
    },
    blockDescription: {
      paragraph: "Düz metin bloğu",
      heading: "Büyük bölüm başlığı",
      todo: "İşaretlenebilir görev",
      list: "Sırasız madde",
    },
    authTitle: "Notlarına giriş yap",
    authBody: "Supabase hesabınla giriş yap veya yeni bir hesap oluştur.",
    email: "E-posta",
    password: "Şifre",
    signIn: "Giriş yap",
    signUp: "Kayıt ol",
    signingIn: "Giriş yapılıyor",
    signingUp: "Kayıt oluşturuluyor",
    needAccount: "Hesabın yok mu?",
    haveAccount: "Zaten hesabın var mı?",
    signOut: "Çıkış yap",
    account: "Hesap",
    authConfigTitle: "Supabase ayarı eksik",
    authConfigBody:
      ".env.local dosyasına NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY değerlerini ekle.",
    authSuccess:
      "Kayıt isteği gönderildi. Supabase e-posta doğrulaması açıksa gelen kutunu kontrol et.",
  },
  en: {
    appSubtitle: "Web MVP",
    newPage: "New page",
    searchPlaceholder: "Search pages",
    saved: "Saved",
    newNotePlaceholder: "New note",
    emptyTitle: "No notes yet",
    emptyBody: "Create a new page and start with a blank note.",
    settings: "Settings",
    language: "Language",
    theme: "Theme",
    lightTheme: "Light",
    darkTheme: "Dark",
    turkish: "Turkish",
    english: "English",
    localeHint: "Dates, search, and interface copy follow the selected language.",
    selectEmoji: "Select emoji",
    writeEmoji: "Type emoji",
    deletePage: "Delete page",
    addBlock: "Start writing",
    addBlockEnd: "Add block to end of page",
    deleteBlock: "Delete block",
    toggleBlock: "Toggle block state",
    blockPlaceholder: {
      paragraph: "Write something",
      heading: "Write a heading",
      todo: "Task to do",
      list: "New item",
    },
    blockLabel: {
      paragraph: "Text",
      heading: "Heading",
      todo: "Todo",
      list: "List",
    },
    blockDescription: {
      paragraph: "Plain text block",
      heading: "Large section heading",
      todo: "Checkable task",
      list: "Unordered item",
    },
    authTitle: "Sign in to your notes",
    authBody: "Use your Supabase account or create a new one.",
    email: "Email",
    password: "Password",
    signIn: "Sign in",
    signUp: "Sign up",
    signingIn: "Signing in",
    signingUp: "Creating account",
    needAccount: "Need an account?",
    haveAccount: "Already have an account?",
    signOut: "Sign out",
    account: "Account",
    authConfigTitle: "Supabase config is missing",
    authConfigBody:
      "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local.",
    authSuccess:
      "Sign-up request sent. If Supabase email confirmation is enabled, check your inbox.",
  },
};

const blockIcons: Record<
  BlockType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  paragraph: FileText,
  heading: Heading1,
  todo: CheckSquare,
  list: List,
};

const starterPages: NotePage[] = [
  {
    id: "today",
    title: "Bugünkü plan",
    emoji: "✦",
    updatedAt: "2026-05-09T17:00:00.000Z",
    blocks: [
      {
        id: "today-title",
        type: "heading",
        content: "Not uygulaması MVP",
      },
      {
        id: "today-intro",
        type: "paragraph",
        content:
          "İlk hedef: sayfa listesi, blok editör, hızlı ekleme ve otomatik kaydetme.",
      },
      {
        id: "today-todo",
        type: "todo",
        content: "PostgreSQL ve kullanıcı girişini ikinci adımda ekle",
        checked: false,
      },
    ],
  },
  {
    id: "ideas",
    title: "Fikirler",
    emoji: "◆",
    updatedAt: "2026-05-09T16:32:00.000Z",
    blocks: [
      {
        id: "ideas-1",
        type: "paragraph",
        content: "Slash command, iç içe sayfalar, paylaşım linki, etiketler.",
      },
    ],
  },
];

const emojiOptions = [
  "📌",
  "📝",
  "✅",
  "💡",
  "📚",
  "🧠",
  "🚀",
  "🎯",
  "📅",
  "🔒",
  "⭐",
  "🔥",
  "💬",
  "🗂️",
  "⚙️",
  "🎨",
  "📊",
  "🌱",
  "🏁",
  "✨",
];

const templateCopy: Record<
  Locale,
  {
    suggested: string;
    quick: Array<{ id: TemplateId; title: string }>;
    suggestedItems: Array<{
      accent: string;
      description: string;
      id: TemplateId;
      preview: string[];
      title: string;
    }>;
    title: string;
  }
> = {
  tr: {
    suggested: "Önerilenler",
    title: "Şablonlar",
    quick: [
      { id: "emptyPage", title: "Boş sayfa" },
      { id: "emptyDatabase", title: "Boş tablo" },
      { id: "buildWithAi", title: "AI ile oluştur" },
    ],
    suggestedItems: [
      {
        accent: "green",
        description: "Görevlerini düzenli takip et.",
        id: "tasks",
        preview: ["Görev adı", "Durum", "Sorumlu"],
        title: "Görev Takibi",
      },
      {
        accent: "blue",
        description: "Projeleri baştan sona yönet.",
        id: "projects",
        preview: ["Planlama", "Devam ediyor", "Tamamlandı"],
        title: "Projeler",
      },
      {
        accent: "red",
        description: "Belgeleri tek merkezde topla.",
        id: "docs",
        preview: ["Doküman", "Oluşturan", "Tarih"],
        title: "Doküman Merkezi",
      },
      {
        accent: "orange",
        description: "Yeni fikirleri birlikte şekillendir.",
        id: "brainstorm",
        preview: ["Fikir", "Kişi", "Öncelik"],
        title: "Beyin Fırtınası",
      },
    ],
  },
  en: {
    suggested: "Suggested",
    title: "Templates",
    quick: [
      { id: "emptyPage", title: "Empty page" },
      { id: "emptyDatabase", title: "Empty database" },
      { id: "buildWithAi", title: "Build with AI" },
    ],
    suggestedItems: [
      {
        accent: "green",
        description: "Stay organized with tasks, your way.",
        id: "tasks",
        preview: ["Task name", "Status", "Assignee"],
        title: "Tasks Tracker",
      },
      {
        accent: "blue",
        description: "Manage projects start to finish.",
        id: "projects",
        preview: ["Not started", "In progress", "Done"],
        title: "Projects",
      },
      {
        accent: "red",
        description: "Collaborate on docs in one hub.",
        id: "docs",
        preview: ["Doc name", "Created by", "Created time"],
        title: "Document Hub",
      },
      {
        accent: "orange",
        description: "Spark new ideas together.",
        id: "brainstorm",
        preview: ["Idea", "Created by", "Priority"],
        title: "Brainstorm Session",
      },
    ],
  },
};

const quickTemplateIcons: Record<
  TemplateId,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  brainstorm: Lightbulb,
  buildWithAi: Bot,
  docs: Files,
  emptyDatabase: Table2,
  emptyPage: FileText,
  projects: FolderKanban,
  tasks: ClipboardList,
};

function BlockMenu({
  afterBlockId,
  onSelect,
  t,
}: {
  afterBlockId?: string;
  onSelect: (type: BlockType, afterBlockId?: string) => void;
  t: Translation;
}) {
  const blockTypes: BlockType[] = ["paragraph", "heading", "todo", "list"];

  return (
    <div
      className="absolute left-0 top-10 z-20 w-56 overflow-hidden rounded-lg border border-[#d5e2de] bg-white py-1 shadow-xl shadow-[#20352f]/10"
      onClick={(event) => event.stopPropagation()}
    >
      {blockTypes.map((type) => {
        const Icon = blockIcons[type];
        return (
          <button
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[#2f3d39] transition hover:bg-[#e8f1ee]"
            key={type}
            onClick={() => onSelect(type, afterBlockId)}
            type="button"
          >
            <span className="grid size-8 place-items-center rounded-md bg-[#e5f0ec] text-[#6b7a76]">
              <Icon size={16} />
            </span>
            <span>
              <span className="block font-medium">{t.blockLabel[type]}</span>
              <span className="block text-xs text-[#82908c]">
                {t.blockDescription[type]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TemplateGallery({
  locale,
  onSelect,
}: {
  locale: Locale;
  onSelect: (templateId: TemplateId) => void;
}) {
  const copy = templateCopy[locale];

  return (
    <div className="mt-8 space-y-7">
      <div className="grid gap-4 md:grid-cols-3">
        {copy.quick.map((template) => {
          const Icon = quickTemplateIcons[template.id];
          return (
            <button
              className="template-quick-card"
              key={template.id}
              onClick={() => onSelect(template.id)}
              type="button"
            >
              <Icon size={24} />
              <span>{template.title}</span>
            </button>
          );
        })}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-[#6f7f7b]">
          {copy.suggested}
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {copy.suggestedItems.map((template) => {
            const Icon = quickTemplateIcons[template.id];
            return (
              <button
                className={`template-card template-card-${template.accent}`}
                key={template.id}
                onClick={() => onSelect(template.id)}
                type="button"
              >
                <span className="block text-xl font-semibold">
                  {template.title}
                </span>
                <span className="mt-1 block text-sm">
                  {template.description}
                </span>
                <span className="template-preview">
                  <span className="mb-3 flex items-center gap-2 font-semibold">
                    <Icon size={18} />
                    {template.title}
                  </span>
                  <span className="grid grid-cols-3 gap-3 text-xs font-medium">
                    {template.preview.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </span>
                  <span className="mt-3 grid grid-cols-3 gap-3">
                    <span className="template-preview-line" />
                    <span className="template-preview-pill" />
                    <span className="template-preview-line" />
                    <span className="template-preview-line" />
                    <span className="template-preview-pill" />
                    <span className="template-preview-line" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AuthPanel({
  locale,
  t,
  onAuthChange,
}: {
  locale: Locale;
  t: Translation;
  onAuthChange: (session: Session | null) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    setMessage("");
    setIsSubmitting(true);

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setIsSubmitting(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    onAuthChange(result.data.session);
    if (mode === "sign-up") {
      setMessage(t.authSuccess);
    }
  }

  if (!supabase) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#f4f8f6] px-6">
        <div className="w-full max-w-md rounded-lg border border-[#d5e2de] bg-white p-6 shadow-xl shadow-[#20352f]/10">
          <div className="mb-4 grid size-11 place-items-center rounded-lg bg-[#1e2a27] text-white">
            <Settings size={20} />
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-[#1e2a27]">
            {t.authConfigTitle}
          </h1>
          <p className="text-sm leading-6 text-[#6b7a76]">{t.authConfigBody}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f4f8f6] px-6">
      <div className="w-full max-w-md rounded-lg border border-[#d5e2de] bg-white p-6 shadow-xl shadow-[#20352f]/10">
        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-[#1e2a27] text-white">
            <UserRound size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#1e2a27]">
              {t.authTitle}
            </h1>
            <p className="text-sm text-[#6b7a76]">{t.authBody}</p>
          </div>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#43524e]">
            {t.email}
            <input
              className="mt-1 h-11 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-3 outline-none focus:border-[#7da69c]"
              dir="ltr"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="block text-sm font-medium text-[#43524e]">
            {t.password}
            <input
              className="mt-1 h-11 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-3 outline-none focus:border-[#7da69c]"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          {message && (
            <p className="rounded-lg bg-[#e8f1ee] px-3 py-2 text-sm leading-5 text-[#596965]">
              {message}
            </p>
          )}

          <button
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1e2a27] px-4 text-sm font-medium text-white transition hover:bg-[#263a35] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting && <Loader2 className="animate-spin" size={17} />}
            {isSubmitting
              ? mode === "sign-in"
                ? t.signingIn
                : t.signingUp
              : mode === "sign-in"
                ? t.signIn
                : t.signUp}
          </button>
        </form>

        <button
          className="mt-4 text-sm font-medium text-[#596965] underline-offset-4 hover:underline"
          onClick={() => {
            setMessage("");
            setMode((currentMode) =>
              currentMode === "sign-in" ? "sign-up" : "sign-in",
            );
          }}
          type="button"
        >
          {mode === "sign-in" ? t.needAccount : t.haveAccount}{" "}
          {mode === "sign-in" ? t.signUp : t.signIn}
        </button>

        <p className="mt-5 text-xs text-[#82908c]">
          {locale === "tr" ? "Dil: Türkçe" : "Language: English"}
        </p>
      </div>
    </section>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function freshBlock(type: BlockType = "paragraph"): NoteBlock {
  return {
    id: createId("block"),
    type,
    content: type === "list" ? "• " : "",
    checked: type === "todo" ? false : undefined,
    checkedLines: type === "todo" ? [false] : undefined,
  };
}

function freshTodoBlock(lineCount = 3): NoteBlock {
  const safeLineCount = Math.max(1, lineCount);

  return {
    id: createId("block"),
    type: "todo",
    content: Array.from({ length: safeLineCount }, () => "").join("\n"),
    checked: false,
    checkedLines: Array.from({ length: safeLineCount }, () => false),
  };
}

function freshTemplateBlock(type: BlockType): NoteBlock {
  if (type === "todo") {
    return freshTodoBlock(1);
  }

  return freshBlock(type);
}

function todoLines(block: NoteBlock) {
  const lines = block.content.split("\n");
  return lines.length > 0 ? lines : [""];
}

function todoCheckedLines(block: NoteBlock, lineCount: number) {
  return Array.from(
    { length: lineCount },
    (_, index) => block.checkedLines?.[index] ?? block.checked ?? false,
  );
}

const generatedTemplateBlockContent = new Set([
  "Ne oluşturmak istediğini yaz",
  "Örnek: Haftalık çalışma planı, ürün fikirleri veya proje taslağı.",
  "Doküman Merkezi",
  "Bu sayfada önemli belgeleri, sahiplerini ve son güncelleme notlarını takip et.",
  "• Ürün gereksinimleri\n• Toplantı notları\n• Tasarım kararları",
  "Yeni tablo",
  "Kolonlarını ve takip edeceğin bilgileri buradan planlayabilirsin.",
  "Beyin Fırtınası",
  "Bugünkü ana fikir",
  "• Fikir\n• Etki\n• Sonraki adım",
  "Projeler",
  "Projeleri durum, sorumlu kişi ve sonraki adımlarla takip et.",
  "• Planlama\n• Devam ediyor\n• Tamamlandı",
  "Görev Takibi",
  "Bugünün öncelikleri",
  "• Yapılacak\n• Devam ediyor\n• Tamamlandı",
  "Describe what you want to create",
  "Example: weekly plan, product ideas, or a project outline.",
  "Document Hub",
  "Track important docs, owners, and latest updates here.",
  "• Product requirements\n• Meeting notes\n• Design decisions",
  "New database",
  "Plan the columns and information you want to track here.",
  "Brainstorm Session",
  "Main idea for today",
  "• Idea\n• Impact\n• Next step",
  "Projects",
  "Track projects by status, owner, and next actions.",
  "• Planning\n• In progress\n• Done",
  "Tasks Tracker",
  "Today's priorities",
  "• To do\n• In progress\n• Done",
]);

function removeGeneratedTemplateBlocks(page: NotePage): NotePage {
  const blocks = page.blocks.filter(
    (block) => !generatedTemplateBlockContent.has(block.content.trim()),
  );

  return blocks.length === page.blocks.length ? page : { ...page, blocks };
}

function formatUpdatedAt(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function displayEmoji(emoji: string) {
  return emoji === "○" ? "" : emoji;
}

function resizeTextarea(element: HTMLTextAreaElement) {
  const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight);
  const verticalPadding =
    Number.parseFloat(getComputedStyle(element).paddingTop) +
    Number.parseFloat(getComputedStyle(element).paddingBottom);
  const scrollLimit = lineHeight * 10 + verticalPadding;
  const lineCount = element.value.split("\n").length;
  const shouldScroll = lineCount > 10 || element.scrollHeight > scrollLimit;

  element.style.height = "auto";
  element.style.height = `${Math.min(element.scrollHeight, scrollLimit)}px`;
  element.classList.toggle("is-scrollable", shouldScroll);
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const [pages, setPages] = useState<NotePage[]>(starterPages);
  const [activePageId, setActivePageId] = useState(starterPages[0].id);
  const [activeView, setActiveView] = useState<ActiveView>("notes");
  const [openBlockMenu, setOpenBlockMenu] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>("tr");
  const [theme, setTheme] = useState<Theme>("light");
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(() => !supabase);
  const [query, setQuery] = useState("");
  const cleanupReadyRef = useRef(false);
  const storageReadyRef = useRef(false);

  const t = translations[locale];

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("notion-lite-pages");
        const savedLocale = window.localStorage.getItem("notion-lite-locale");
        const savedTheme = window.localStorage.getItem("notion-lite-theme");

        if (savedLocale === "tr" || savedLocale === "en") {
          setLocale(savedLocale);
        }

        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
        }

        if (saved !== null) {
          const storedPages = JSON.parse(saved) as NotePage[];
          setPages(storedPages.map(removeGeneratedTemplateBlocks));
          setActivePageId(storedPages[0]?.id ?? "");
        }
      } finally {
        storageReadyRef.current = true;
      }
    }, 0);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark-theme", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!storageReadyRef.current || cleanupReadyRef.current) {
      return;
    }

    setPages((currentPages) => {
      const cleanedPages = currentPages.map(removeGeneratedTemplateBlocks);
      const hasChanged = cleanedPages.some(
        (page, index) => page.blocks.length !== currentPages[index].blocks.length,
      );

      return hasChanged ? cleanedPages : currentPages;
    });
    cleanupReadyRef.current = true;
  }, [pages]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (storageReadyRef.current) {
      window.localStorage.setItem("notion-lite-pages", JSON.stringify(pages));
      window.localStorage.setItem("notion-lite-locale", locale);
      window.localStorage.setItem("notion-lite-theme", theme);
    }
  }, [locale, pages, theme]);

  useEffect(() => {
    function closeMenusWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenBlockMenu(null);
        setEmojiPickerOpen(false);
        setSettingsOpen(false);
      }
    }

    window.addEventListener("keydown", closeMenusWithEscape);
    return () => window.removeEventListener("keydown", closeMenusWithEscape);
  }, []);

  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];

  const filteredPages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(
      locale === "tr" ? "tr-TR" : "en-US",
    );
    if (!normalizedQuery) return pages;

    return pages.filter((page) => {
      const body = page.blocks.map((block) => block.content).join(" ");
      return `${page.title} ${body}`
        .toLocaleLowerCase(locale === "tr" ? "tr-TR" : "en-US")
        .includes(normalizedQuery);
    });
  }, [locale, pages, query]);

  function updateActivePage(updater: (page: NotePage) => NotePage) {
    if (!activePage) return;

    setPages((currentPages) =>
      currentPages.map((page) =>
        page.id === activePage.id
          ? { ...updater(page), updatedAt: new Date().toISOString() }
          : page,
      ),
    );
  }

  function addPage() {
    const newPage: NotePage = {
      id: createId("page"),
      title: "",
      emoji: "",
      updatedAt: new Date().toISOString(),
      blocks: [],
    };
    setPages((currentPages) => [newPage, ...currentPages]);
    setActivePageId(newPage.id);
    setActiveView("notes");
  }

  function deletePage(pageId: string) {
    const remainingPages = pages.filter((page) => page.id !== pageId);
    setPages(remainingPages);

    if (pageId === activePageId) {
      setActivePageId(remainingPages[0]?.id ?? "");
    }
  }

  function updateBlock(blockId: string, patch: Partial<NoteBlock>) {
    updateActivePage((page) => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  }

  function updateTodoLine(block: NoteBlock, lineIndex: number, value: string) {
    const lines = todoLines(block);
    const checkedLines = todoCheckedLines(block, lines.length);

    lines[lineIndex] = value;
    updateBlock(block.id, {
      checked: checkedLines.every(Boolean),
      checkedLines,
      content: lines.join("\n"),
    });
  }

  function addTodoLine(block: NoteBlock, afterLineIndex: number) {
    const lines = todoLines(block);
    const checkedLines = todoCheckedLines(block, lines.length);

    lines.splice(afterLineIndex + 1, 0, "");
    checkedLines.splice(afterLineIndex + 1, 0, false);

    updateBlock(block.id, {
      checked: false,
      checkedLines,
      content: lines.join("\n"),
    });
  }

  function removeTodoLine(block: NoteBlock, lineIndex: number) {
    const lines = todoLines(block);
    const checkedLines = todoCheckedLines(block, lines.length);

    if (lines.length === 1) {
      updateBlock(block.id, {
        checked: false,
        checkedLines: [false],
        content: "",
      });
      return;
    }

    lines.splice(lineIndex, 1);
    checkedLines.splice(lineIndex, 1);

    updateBlock(block.id, {
      checked: checkedLines.every(Boolean),
      checkedLines,
      content: lines.join("\n"),
    });
  }

  function toggleTodoLine(block: NoteBlock, lineIndex: number) {
    const lines = todoLines(block);
    const checkedLines = todoCheckedLines(block, lines.length);

    checkedLines[lineIndex] = !checkedLines[lineIndex];
    updateBlock(block.id, {
      checked: checkedLines.every(Boolean),
      checkedLines,
      content: lines.join("\n"),
    });
  }

  function addBlock(type: BlockType, afterBlockId?: string) {
    updateActivePage((page) => ({
      ...page,
      blocks: afterBlockId
        ? page.blocks.flatMap((block) =>
            block.id === afterBlockId ? [block, freshBlock(type)] : [block],
          )
        : [...page.blocks, freshBlock(type)],
    }));
    setOpenBlockMenu(null);
  }

  function applyTemplate(templateId: TemplateId) {
    const templates = templateCopy[locale];
    const selectedTemplate =
      templates.quick.find((template) => template.id === templateId) ??
      templates.suggestedItems.find((template) => template.id === templateId);

    const templateBlocks: Partial<Record<TemplateId, BlockType[]>> = {
      brainstorm: ["list"],
      buildWithAi: ["paragraph"],
      docs: ["list"],
      emptyDatabase: ["list"],
      emptyPage: ["paragraph"],
      projects: ["todo", "list"],
      tasks: ["todo"],
    };
    const nextBlocks = (templateBlocks[templateId] ?? ["paragraph"]).map(
      freshTemplateBlock,
    );

    const newPage: NotePage = {
      id: createId("page"),
      title:
        templateId === "emptyPage"
          ? ""
          : (selectedTemplate?.title ?? ""),
      emoji:
        templateId === "tasks"
          ? "✅"
          : templateId === "projects"
            ? "📁"
            : templateId === "docs"
              ? "📄"
              : templateId === "brainstorm"
                ? "💡"
                : templateId === "buildWithAi"
                  ? "✨"
                  : templateId === "emptyDatabase"
                    ? "📊"
                    : "",
      updatedAt: new Date().toISOString(),
      blocks: nextBlocks,
    };

    setPages((currentPages) => [newPage, ...currentPages]);
    setActivePageId(newPage.id);
    setActiveView("notes");
  }

  function removeBlock(blockId: string) {
    updateActivePage((page) => ({
      ...page,
      blocks: page.blocks.filter((block) => block.id !== blockId),
    }));
  }

  function updatePageEmoji(emoji: string) {
    updateActivePage((page) => ({
      ...page,
      emoji: emoji.trim(),
    }));
  }

  function closeFloatingMenus() {
    setOpenBlockMenu(null);
    setEmojiPickerOpen(false);
    setSettingsOpen(false);
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setSession(null);
  }

  if (!authReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f8f6] text-[#1e2a27]">
        <Loader2 className="animate-spin text-[#687874]" size={24} />
      </main>
    );
  }

  if (!session) {
    return <AuthPanel locale={locale} onAuthChange={setSession} t={t} />;
  }

  return (
    <main
      className="min-h-screen bg-[#f4f8f6] text-[#1e2a27]"
      onClick={closeFloatingMenus}
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[300px_1fr]">
        <aside className="flex flex-col border-b border-[#d5e2de] bg-[#edf5f2] px-4 py-4 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-lg bg-[#1e2a27] text-white">
                <LayoutGrid size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">Not Workspace</p>
                <p className="text-xs text-[#6f7f7b]">{t.appSubtitle}</p>
              </div>
            </div>
            <button
              aria-label={t.newPage}
              className="grid size-9 place-items-center rounded-lg border border-[#d5e2de] bg-white text-[#1e2a27] shadow-sm transition hover:border-[#9bb8b0]"
              onClick={addPage}
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>

          <label className="mb-4 flex h-10 items-center gap-2 rounded-lg border border-[#d5e2de] bg-white px-3 text-sm text-[#6f7f7b] shadow-sm">
            <Search size={16} />
            <input
              className="min-w-0 flex-1 bg-transparent text-[#1e2a27] outline-none placeholder:text-[#93a09c]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.searchPlaceholder}
              value={query}
            />
          </label>

          <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {filteredPages.map((page) => (
              <div
                className={`group flex w-full items-center gap-1 rounded-lg p-1 transition ${
                  activeView === "notes" && page.id === activePage?.id
                    ? "bg-white shadow-sm"
                    : "text-[#596965] hover:bg-white/60"
                }`}
                key={page.id}
              >
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1 text-left text-sm"
                  onClick={() => {
                    setActivePageId(page.id);
                    setActiveView("notes");
                  }}
                  type="button"
                >
                  <span className="grid size-7 place-items-center rounded-md bg-[#dcebe6] text-xs">
                    {displayEmoji(page.emoji)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {page.title || t.newNotePlaceholder}
                    </span>
                    <span className="block text-xs text-[#82908c]">
                      {formatUpdatedAt(page.updatedAt, locale)}
                    </span>
                  </span>
                </button>
                <button
                  aria-label={t.deletePage}
                  className="grid size-8 shrink-0 place-items-center rounded-md text-[#8b9995] opacity-0 transition hover:bg-[#fde8e5] hover:text-[#b42318] group-hover:opacity-100"
                  onClick={() => deletePage(page.id)}
                  type="button"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </nav>

          <div
            className="relative mt-4 border-t border-[#d5e2de] pt-3"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className={`mb-2 flex min-h-12 w-full items-center justify-between rounded-lg border p-3 text-left text-sm shadow-sm transition hover:border-[#9bb8b0] ${
                activeView === "templates"
                  ? "border-[#9bb8b0] bg-white"
                  : "border-[#d5e2de] bg-white"
              }`}
              onClick={() => {
                setActiveView("templates");
                setSettingsOpen(false);
              }}
              type="button"
            >
              <span className="flex items-center gap-2 font-medium text-[#43524e]">
                <Files size={16} />
                {templateCopy[locale].title}
              </span>
              <Table2 size={16} className="text-[#7b8b87]" />
            </button>

            <button
              className="flex min-h-16 w-full items-center justify-between rounded-lg border border-[#d5e2de] bg-white p-3 text-left text-sm shadow-sm transition hover:border-[#9bb8b0]"
              onClick={() => setSettingsOpen((currentValue) => !currentValue)}
              type="button"
            >
              <span>
                <span className="flex items-center gap-2 font-medium text-[#43524e]">
                  <Settings size={16} />
                  {t.settings}
                </span>
                <span className="mt-1 block text-xs text-[#687874]">
                  {locale === "tr" ? t.turkish : t.english} ·{" "}
                  {theme === "dark" ? t.darkTheme : t.lightTheme}
                </span>
              </span>
              <UserRound size={17} className="text-[#7b8b87]" />
            </button>

            {settingsOpen && (
              <div className="absolute bottom-20 left-0 z-30 w-full rounded-lg border border-[#d5e2de] bg-white p-3 shadow-xl shadow-[#20352f]/10">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#26332f]">
                  <UserRound size={17} />
                  {t.account}
                </div>
                <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-[#d5e2de] bg-[#fbfefd] p-2">
                  <span className="min-w-0 truncate text-xs text-[#687874]">
                    {session.user.email}
                  </span>
                  <button
                    aria-label={t.signOut}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-[#7b8b87] transition hover:bg-[#fde8e5] hover:text-[#b42318]"
                    onClick={signOut}
                    type="button"
                  >
                    <LogOut size={15} />
                  </button>
                </div>

                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#26332f]">
                  <Languages size={17} />
                  {t.language}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["tr", "en"] as const).map((option) => (
                    <button
                      className={`h-10 rounded-lg border px-3 text-sm font-medium transition ${
                        locale === option
                          ? "border-[#1e2a27] bg-[#1e2a27] text-white"
                          : "border-[#d5e2de] bg-[#fbfefd] text-[#43524e] hover:border-[#9bb8b0]"
                      }`}
                      key={option}
                      onClick={() => setLocale(option)}
                      type="button"
                    >
                      {option === "tr" ? t.turkish : t.english}
                    </button>
                  ))}
                </div>
                <div className="mb-3 mt-4 flex items-center gap-2 text-sm font-semibold text-[#26332f]">
                  <Settings size={17} />
                  {t.theme}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(["light", "dark"] as const).map((option) => (
                    <button
                      className={`h-10 rounded-lg border px-3 text-sm font-medium transition ${
                        theme === option
                          ? "border-[#1e2a27] bg-[#1e2a27] text-white"
                          : "border-[#d5e2de] bg-[#fbfefd] text-[#43524e] hover:border-[#9bb8b0]"
                      }`}
                      key={option}
                      onClick={() => setTheme(option)}
                      type="button"
                    >
                      {option === "light" ? t.lightTheme : t.darkTheme}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-[#687874]">
                  {t.localeHint}
                </p>
              </div>
            )}
          </div>
        </aside>

        {activeView === "templates" ? (
          <section className="light-tree-surface min-w-0 overflow-y-auto bg-[#fbfefd] px-5 py-8">
            <div className="relative z-10 mx-auto w-full max-w-5xl">
              <h1 className="mb-7 text-4xl font-semibold tracking-normal text-[#26332f]">
                {templateCopy[locale].title}
              </h1>
              <TemplateGallery locale={locale} onSelect={applyTemplate} />
            </div>
          </section>
        ) : activePage ? (
          <section className="light-tree-surface flex min-w-0 flex-col bg-[#fbfefd]">
            <header className="relative z-10 flex items-center border-b border-[#dce8e4] px-5 py-3">
              <div className="flex items-center gap-2 text-sm text-[#687874]">
                <Circle size={10} fill="#14a37f" strokeWidth={0} />
                {t.saved}
              </div>
            </header>

            <article className="relative z-10 w-full max-w-3xl self-center px-5 py-8 sm:px-8 lg:px-0">
              <div className="mb-7 flex items-center gap-3 px-1 py-1">
                <div
                  className="relative"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    aria-label={t.selectEmoji}
                    className="grid size-12 shrink-0 place-items-center rounded-lg border border-[#d5e2de] bg-transparent text-2xl transition hover:border-[#9bb8b0] focus:outline-none focus:ring-2 focus:ring-[#9bb8b0]"
                    onClick={() =>
                      setEmojiPickerOpen((currentValue) => !currentValue)
                    }
                    type="button"
                  >
                    {displayEmoji(activePage.emoji)}
                  </button>

                  {emojiPickerOpen && (
                    <div className="absolute left-0 top-16 z-30 w-72 rounded-lg border border-[#d5e2de] bg-white p-3 shadow-xl shadow-[#20352f]/10">
                      <input
                        aria-label={t.writeEmoji}
                        className="mb-3 h-10 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-3 text-center text-xl outline-none focus:border-[#7da69c]"
                        maxLength={4}
                        onChange={(event) => updatePageEmoji(event.target.value)}
                        placeholder={t.writeEmoji}
                        value={displayEmoji(activePage.emoji)}
                      />
                      <div className="grid grid-cols-5 gap-1">
                        {emojiOptions.map((emoji) => (
                          <button
                            aria-label={`${emoji} ${t.selectEmoji}`}
                            className="grid size-10 place-items-center rounded-md text-xl transition hover:bg-[#e7f0ec]"
                            key={emoji}
                            onClick={() => {
                              updatePageEmoji(emoji);
                              setEmojiPickerOpen(false);
                            }}
                            type="button"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  className="note-title-input min-w-0 flex-1 bg-transparent text-5xl font-semibold tracking-normal outline-none placeholder:text-[#9eaca8]"
                  onChange={(event) =>
                    updateActivePage((page) => ({
                      ...page,
                      title: event.target.value,
                    }))
                  }
                  placeholder={t.newNotePlaceholder}
                  value={activePage.title}
                />
              </div>

              <div className="space-y-2">
                {activePage.blocks.map((block) => {
                  const Icon = blockIcons[block.type];
                  return (
                    <div
                      className="group relative grid grid-cols-[40px_28px_1fr_32px] items-start gap-2 rounded-lg px-2 py-1"
                      key={block.id}
                    >
                      <div
                        className="relative -ml-1 grid min-h-10 place-items-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <button
                          aria-label={t.addBlock}
                          className="grid size-8 place-items-center rounded-md border border-transparent bg-white/70 text-[#596965] opacity-0 shadow-sm transition hover:border-[#9bb8b0] hover:bg-white hover:text-[#1e2a27] group-hover:opacity-100 focus:opacity-100"
                          onClick={() =>
                            setOpenBlockMenu((currentMenu) =>
                              currentMenu === block.id ? null : block.id,
                            )
                          }
                          type="button"
                        >
                          <Plus size={17} />
                        </button>
                        {openBlockMenu === block.id && (
                          <BlockMenu
                            afterBlockId={block.id}
                            onSelect={addBlock}
                            t={t}
                          />
                        )}
                      </div>

                      {block.type === "todo" ? (
                        <>
                          <span className="mt-2 grid size-6 place-items-center rounded-md text-[#7b8b87]">
                            <Icon size={16} />
                          </span>

                          <div className="col-start-3 col-end-5 space-y-1 py-1 pr-9">
                            {todoLines(block).map((line, lineIndex) => {
                              const isChecked = todoCheckedLines(
                                block,
                                todoLines(block).length,
                              )[lineIndex];

                              return (
                                <div
                                  className="flex min-h-8 items-start gap-2"
                                  key={`${block.id}-${lineIndex}`}
                                >
                                  <button
                                    aria-label={t.toggleBlock}
                                    className="mt-1 grid size-5 shrink-0 place-items-center rounded-md text-[#7b8b87] transition hover:bg-white hover:text-[#0f8a68]"
                                    onClick={() =>
                                      toggleTodoLine(block, lineIndex)
                                    }
                                    type="button"
                                  >
                                    <CheckSquare
                                      className={
                                        isChecked ? "text-[#0f8a68]" : ""
                                      }
                                      size={16}
                                    />
                                  </button>
                                  <textarea
                                    className={`note-todo-input min-h-7 flex-1 resize-none overflow-hidden bg-transparent text-base leading-7 outline-none placeholder:text-[#9eaca8] ${
                                      isChecked
                                        ? "text-[#879591] line-through"
                                        : ""
                                    }`}
                                    data-todo-block={block.id}
                                    data-todo-line={lineIndex}
                                    onChange={(event) =>
                                      updateTodoLine(
                                        block,
                                        lineIndex,
                                        event.target.value,
                                      )
                                    }
                                    onFocus={(event) =>
                                      resizeTextarea(event.currentTarget)
                                    }
                                    onInput={(event) =>
                                      resizeTextarea(event.currentTarget)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.preventDefault();
                                        addTodoLine(block, lineIndex);
                                        window.requestAnimationFrame(() => {
                                          document
                                            .querySelector<HTMLTextAreaElement>(
                                              `[data-todo-block="${block.id}"][data-todo-line="${lineIndex + 1}"]`,
                                            )
                                            ?.focus();
                                        });
                                        return;
                                      }

                                      if (
                                        event.key === "Backspace" &&
                                        line === ""
                                      ) {
                                        event.preventDefault();
                                        removeTodoLine(block, lineIndex);
                                        window.requestAnimationFrame(() => {
                                          document
                                            .querySelector<HTMLTextAreaElement>(
                                              `[data-todo-block="${block.id}"][data-todo-line="${Math.max(0, lineIndex - 1)}"]`,
                                            )
                                            ?.focus();
                                        });
                                      }
                                    }}
                                    placeholder={t.blockPlaceholder.todo}
                                    rows={1}
                                    value={line}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="mt-2 grid size-6 place-items-center rounded-md text-[#7b8b87]">
                            <Icon size={16} />
                          </span>

                          <textarea
                            className={`note-textarea col-start-3 col-end-5 min-h-10 w-full resize-none overflow-y-hidden bg-transparent py-1.5 pr-9 outline-none placeholder:text-[#9eaca8] ${
                              block.type === "heading"
                                ? "text-2xl font-semibold"
                                : block.type === "list"
                                  ? "text-base leading-8"
                                  : "text-base leading-7"
                            }`}
                            onChange={(event) =>
                              updateBlock(block.id, {
                                content: event.target.value,
                              })
                            }
                            onInput={(event) =>
                              resizeTextarea(event.currentTarget)
                            }
                            onKeyDown={(event) => {
                              if (
                                block.type !== "list" ||
                                event.key !== "Enter"
                              ) {
                                return;
                              }

                              event.preventDefault();

                              const target = event.currentTarget;
                              const start = target.selectionStart;
                              const end = target.selectionEnd;
                              const nextContent = `${target.value.slice(0, start)}\n• ${target.value.slice(end)}`;

                              updateBlock(block.id, { content: nextContent });

                              window.requestAnimationFrame(() => {
                                target.selectionStart = start + 3;
                                target.selectionEnd = start + 3;
                                resizeTextarea(target);
                              });
                            }}
                            placeholder={t.blockPlaceholder[block.type]}
                            rows={block.type === "heading" ? 1 : 2}
                            value={block.content}
                          />
                        </>
                      )}

                      <button
                        aria-label={t.deleteBlock}
                        className="col-start-4 row-start-1 mt-2 grid size-7 place-items-center justify-self-end rounded-md text-[#9aa8a4] opacity-0 transition hover:bg-white hover:text-[#b42318] group-hover:opacity-100"
                        onClick={() => removeBlock(block.id)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="relative mt-2 flex min-h-12 items-center px-2">
                <div
                  className="relative -ml-1 flex min-h-12 items-center gap-2"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    aria-label={t.addBlockEnd}
                    className="grid size-8 place-items-center rounded-md border border-[#cfdcd8] bg-transparent text-[#687874] transition hover:border-[#9bb8b0] hover:text-[#1e2a27]"
                    onClick={() =>
                      setOpenBlockMenu((currentMenu) =>
                        currentMenu === "end" ? null : "end",
                      )
                    }
                    type="button"
                  >
                    <Plus size={17} />
                  </button>
                  <span className="text-sm text-[#687874]">{t.addBlock}</span>
                  {openBlockMenu === "end" && (
                    <BlockMenu onSelect={addBlock} t={t} />
                  )}
                </div>
              </div>
            </article>
          </section>
        ) : (
          <section className="flex min-w-0 items-center justify-center bg-[#fbfefd] px-6">
            <div className="relative z-10 max-w-sm text-center">
              <p className="mb-2 text-lg font-semibold text-[#26332f]">
                {t.emptyTitle}
              </p>
              <p className="mb-5 text-sm leading-6 text-[#687874]">
                {t.emptyBody}
              </p>
              <button
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1e2a27] px-4 text-sm font-medium text-white transition hover:bg-[#263a35]"
                onClick={addPage}
                type="button"
              >
                <Plus size={17} />
                {t.newPage}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
