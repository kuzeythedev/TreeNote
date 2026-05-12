"use client";

import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  ClipboardList,
  Circle,
  FileText,
  Files,
  FolderKanban,
  Heading1,
  Eye,
  EyeOff,
  Languages,
  Lightbulb,
  LogOut,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Phone,
  Search,
  Settings,
  Table2,
  Target,
  Trash2,
  Utensils,
  WalletCards,
  UserRound,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadWorkspace, saveWorkspace } from "@/lib/supabase/workspace";

type Locale = "tr" | "en";
type Theme = "light" | "dark";
type ActiveView = "notes" | "templates" | "agenda";
type BlockType = "paragraph" | "heading" | "todo" | "list" | "table";
type SyncStatus = "error" | "loading" | "local" | "saved" | "saving";
type AgendaScope = "daily" | "monthly" | "yearly";
type TemplateId =
  | "emptyPage"
  | "emptyDatabase"
  | "tasks"
  | "projects"
  | "docs"
  | "brainstorm"
  | "diet"
  | "goals"
  | "habits"
  | "finance"
  | "study";

type TemplateAccent = "blue" | "green" | "orange" | "purple" | "red" | "teal" | "yellow";

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
  system?: "agenda";
};

type AgendaItem = {
  id: string;
  text: string;
  done: boolean;
};

type AgendaPlan = {
  note: string;
  items: AgendaItem[];
  dayNotes?: Record<string, string>;
};

type AgendaState = Record<AgendaScope, AgendaPlan>;

type Translation = {
  appSubtitle: string;
  newPage: string;
  searchPlaceholder: string;
  saved: string;
  saving: string;
  syncError: string;
  localOnly: string;
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
  addTableRow: string;
  toggleBlock: string;
  blockPlaceholder: Record<BlockType, string>;
  blockLabel: Record<BlockType, string>;
  blockDescription: Record<BlockType, string>;
  authTitle: string;
  authBody: string;
  email: string;
  phone: string;
  password: string;
  showPassword: string;
  hidePassword: string;
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
  authEmailRequired: string;
  authEmailInvalid: string;
  authPasswordRequired: string;
  authPasswordShort: string;
  authInvalidCredentials: string;
  authEmailNotConfirmed: string;
  authGenericError: string;
  authConnectionError: string;
  agenda: string;
  agendaSubtitle: string;
  agendaDaily: string;
  agendaMonthly: string;
  agendaYearly: string;
  agendaNotePlaceholder: Record<AgendaScope, string>;
  agendaItems: string;
  agendaNewItem: string;
  addAgendaItem: string;
  deleteAgendaItem: string;
  agendaEmptyItem: string;
  previousYear: string;
  nextYear: string;
  selectedDay: string;
  yearlyCalendarHint: string;
};

const translations: Record<Locale, Translation> = {
  tr: {
    appSubtitle: "Düşüncelerini dallandır",
    newPage: "Yeni sayfa",
    searchPlaceholder: "Sayfalarda ara",
    saved: "Kaydedildi",
    saving: "Kaydediliyor",
    syncError: "Yerel kayıt",
    localOnly: "Yerel mod",
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
    addTableRow: "Satır ekle",
    toggleBlock: "Blok durumunu değiştir",
    blockPlaceholder: {
      paragraph: "Bir şeyler yaz",
      heading: "Başlık yaz",
      todo: "Yapılacak iş",
      list: "Yeni madde",
      table: "Tablo hücresi",
    },
    blockLabel: {
      paragraph: "Metin",
      heading: "Başlık",
      todo: "Todo",
      list: "Liste",
      table: "Tablo",
    },
    blockDescription: {
      paragraph: "Düz metin bloğu",
      heading: "Büyük bölüm başlığı",
      todo: "İşaretlenebilir görev",
      list: "Sırasız madde",
      table: "Satır ve kolonlarla planla",
    },
    authTitle: "Notlarına giriş yap",
    authBody: "Supabase hesabınla giriş yap veya yeni bir hesap oluştur.",
    email: "E-posta",
    phone: "Telefon numarası",
    password: "Şifre",
    showPassword: "Şifreyi göster",
    hidePassword: "Şifreyi gizle",
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
    authEmailRequired: "E-posta adresini yaz.",
    authEmailInvalid: "Geçerli bir e-posta adresi yaz.",
    authPasswordRequired: "Şifreni yaz.",
    authPasswordShort: "Şifre en az 6 karakter olmalı.",
    authInvalidCredentials: "E-posta veya şifre hatalı. Hesabın yoksa önce kayıt ol.",
    authEmailNotConfirmed: "Giriş yapmadan önce e-posta adresini doğrula.",
    authGenericError: "İşlem tamamlanamadı. Bilgilerini kontrol edip tekrar dene.",
    authConnectionError:
      "Supabase bağlantısı kurulamadı. İnternetini veya proje ayarlarını kontrol et.",
    agenda: "Ajanda",
    agendaSubtitle: "Günlük, aylık ve yıllık planlarını yönet.",
    agendaDaily: "Günlük",
    agendaMonthly: "Aylık",
    agendaYearly: "Yıllık",
    agendaNotePlaceholder: {
      daily: "Yazmaya başla",
      monthly: "Yazmaya başla",
      yearly: "Yazmaya başla",
    },
    agendaItems: "Plan maddeleri",
    agendaNewItem: "Yeni plan maddesi",
    addAgendaItem: "Madde ekle",
    deleteAgendaItem: "Maddeyi sil",
    agendaEmptyItem: "Plan yaz",
    previousYear: "Önceki yıl",
    nextYear: "Sonraki yıl",
    selectedDay: "Seçili gün",
    yearlyCalendarHint: "Gün seçip o güne özel planını yaz.",
  },
  en: {
    appSubtitle: "Branch out your thoughts",
    newPage: "New page",
    searchPlaceholder: "Search pages",
    saved: "Saved",
    saving: "Saving",
    syncError: "Saved locally",
    localOnly: "Local mode",
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
    addTableRow: "Add row",
    toggleBlock: "Toggle block state",
    blockPlaceholder: {
      paragraph: "Write something",
      heading: "Write a heading",
      todo: "Task to do",
      list: "New item",
      table: "Table cell",
    },
    blockLabel: {
      paragraph: "Text",
      heading: "Heading",
      todo: "Todo",
      list: "List",
      table: "Table",
    },
    blockDescription: {
      paragraph: "Plain text block",
      heading: "Large section heading",
      todo: "Checkable task",
      list: "Unordered item",
      table: "Plan with rows and columns",
    },
    authTitle: "Sign in to your notes",
    authBody: "Use your Supabase account or create a new one.",
    email: "Email",
    phone: "Phone number",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
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
    authEmailRequired: "Enter your email address.",
    authEmailInvalid: "Enter a valid email address.",
    authPasswordRequired: "Enter your password.",
    authPasswordShort: "Password must be at least 6 characters.",
    authInvalidCredentials:
      "Email or password is incorrect. Create an account first if you do not have one.",
    authEmailNotConfirmed: "Confirm your email address before signing in.",
    authGenericError: "Could not complete the request. Check your details and try again.",
    authConnectionError:
      "Could not connect to Supabase. Check your connection or project settings.",
    agenda: "Agenda",
    agendaSubtitle: "Plan daily, monthly, and yearly work.",
    agendaDaily: "Daily",
    agendaMonthly: "Monthly",
    agendaYearly: "Yearly",
    agendaNotePlaceholder: {
      daily: "Start writing",
      monthly: "Start writing",
      yearly: "Start writing",
    },
    agendaItems: "Plan items",
    agendaNewItem: "New plan item",
    addAgendaItem: "Add item",
    deleteAgendaItem: "Delete item",
    agendaEmptyItem: "Write a plan",
    previousYear: "Previous year",
    nextYear: "Next year",
    selectedDay: "Selected day",
    yearlyCalendarHint: "Select a day and write its plan.",
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
  table: Table2,
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

const emptyAgendaPlan: AgendaPlan = {
  note: "",
  items: [],
};

const defaultAgenda: AgendaState = {
  daily: { ...emptyAgendaPlan },
  monthly: { ...emptyAgendaPlan },
  yearly: { ...emptyAgendaPlan },
};

const monthIndexes = Array.from({ length: 12 }, (_, index) => index);

const templateCopy: Record<
  Locale,
  {
    suggested: string;
    quick: Array<{ id: TemplateId; title: string }>;
    suggestedItems: Array<{
      accent: TemplateAccent;
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
      {
        accent: "teal",
        description: "Öğün, su ve hedeflerini aynı tabloda takip et.",
        id: "diet",
        preview: ["Gün", "Öğün", "Hedef"],
        title: "Diyet Planı",
      },
      {
        accent: "purple",
        description: "Hedeflerini ölçülebilir adımlara ayır.",
        id: "goals",
        preview: ["Hedef", "Ölçüm", "Tarih"],
        title: "Hedef Takibi",
      },
      {
        accent: "yellow",
        description: "Alışkanlıklarını haftalık ritimde takip et.",
        id: "habits",
        preview: ["Alışkanlık", "Sıklık", "Durum"],
        title: "Alışkanlık Takibi",
      },
      {
        accent: "blue",
        description: "Gelir, gider ve bütçe notlarını düzenle.",
        id: "finance",
        preview: ["Kalem", "Tutar", "Durum"],
        title: "Bütçe Planı",
      },
      {
        accent: "green",
        description: "Ders, kaynak ve tekrarlarını planla.",
        id: "study",
        preview: ["Konu", "Kaynak", "Tekrar"],
        title: "Çalışma Planı",
      },
    ],
  },
  en: {
    suggested: "Suggested",
    title: "Templates",
    quick: [
      { id: "emptyPage", title: "Empty page" },
      { id: "emptyDatabase", title: "Empty database" },
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
      {
        accent: "teal",
        description: "Track meals, water, and goals in one table.",
        id: "diet",
        preview: ["Day", "Meal", "Goal"],
        title: "Diet Plan",
      },
      {
        accent: "purple",
        description: "Turn goals into measurable steps.",
        id: "goals",
        preview: ["Goal", "Metric", "Date"],
        title: "Goal Tracker",
      },
      {
        accent: "yellow",
        description: "Follow your habits across the week.",
        id: "habits",
        preview: ["Habit", "Rhythm", "Status"],
        title: "Habit Tracker",
      },
      {
        accent: "blue",
        description: "Organize income, expenses, and budget notes.",
        id: "finance",
        preview: ["Item", "Amount", "Status"],
        title: "Budget Planner",
      },
      {
        accent: "green",
        description: "Plan subjects, resources, and reviews.",
        id: "study",
        preview: ["Topic", "Resource", "Review"],
        title: "Study Plan",
      },
    ],
  },
};

const quickTemplateIcons: Record<
  TemplateId,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  brainstorm: Lightbulb,
  diet: Utensils,
  docs: Files,
  emptyDatabase: Table2,
  emptyPage: FileText,
  finance: WalletCards,
  goals: Target,
  habits: CalendarCheck,
  projects: FolderKanban,
  study: BookOpen,
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
  const blockTypes: BlockType[] = [
    "paragraph",
    "heading",
    "todo",
    "list",
    "table",
  ];

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
          const Icon = quickTemplateIcons[template.id] ?? Table2;
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
            const Icon = quickTemplateIcons[template.id] ?? Table2;
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
                  <span className="template-preview-table mt-3">
                    {Array.from({ length: 3 }).map((_, rowIndex) => (
                      <span
                        className="grid grid-cols-3 gap-3 border-t border-current/10 py-2 first:border-t-0"
                        key={rowIndex}
                      >
                        <span className="template-preview-line" />
                        <span className="template-preview-pill" />
                        <span className="template-preview-line" />
                      </span>
                    ))}
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

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function calendarOffset(year: number, monthIndex: number, locale: Locale) {
  const day = new Date(year, monthIndex, 1).getDay();
  return locale === "tr" ? (day + 6) % 7 : day;
}

function formatAgendaDate(key: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateFromKey(key));
}

function monthName(year: number, monthIndex: number, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: "long",
  }).format(new Date(year, monthIndex, 1));
}

function weekdayLabels(locale: Locale) {
  const baseDate = locale === "tr" ? new Date(2026, 4, 11) : new Date(2026, 4, 10);

  return Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
      weekday: "narrow",
    }).format(new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + index)),
  );
}

function AgendaView({
  agenda,
  locale,
  onAddItem,
  onDeleteItem,
  onUpdateDayNote,
  onToggleItem,
  onUpdateItem,
  onUpdateNote,
  t,
}: {
  agenda: AgendaState;
  locale: Locale;
  onAddItem: (scope: AgendaScope) => void;
  onDeleteItem: (scope: AgendaScope, itemId: string) => void;
  onUpdateDayNote: (date: string, note: string) => void;
  onToggleItem: (scope: AgendaScope, itemId: string) => void;
  onUpdateItem: (scope: AgendaScope, itemId: string, text: string) => void;
  onUpdateNote: (scope: AgendaScope, note: string) => void;
  t: Translation;
}) {
  const [activeScope, setActiveScope] = useState<AgendaScope>("daily");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const scopes: Array<{
    icon: React.ComponentType<{ size?: number; className?: string }>;
    key: AgendaScope;
    label: string;
  }> = [
    { icon: CalendarDays, key: "daily", label: t.agendaDaily },
    { icon: CalendarCheck, key: "monthly", label: t.agendaMonthly },
    { icon: CalendarRange, key: "yearly", label: t.agendaYearly },
  ];
  const activePlan = agenda[activeScope];
  const dayNotes = agenda.yearly.dayNotes ?? {};
  const selectedDayNote = dayNotes[selectedDate] ?? "";
  const weekDays = weekdayLabels(locale);
  const completedItems = activePlan.items.filter((item) => item.done).length;
  const writtenDayCount = Object.values(dayNotes).filter((note) =>
    note.trim(),
  ).length;

  function scopeMeta(scope: AgendaScope) {
    const plan = agenda[scope];
    const done = plan.items.filter((item) => item.done).length;
    const total = plan.items.length;

    return {
      done,
      noteReady:
        scope === "yearly"
          ? writtenDayCount > 0 || Boolean(plan.note.trim())
          : Boolean(plan.note.trim()),
      total,
    };
  }

  return (
    <section className="light-tree-surface min-w-0 overflow-y-auto bg-[#fbfefd] px-5 py-7">
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="mb-5 flex flex-col gap-2">
          <div>
            <h1 className="text-4xl font-semibold tracking-normal text-[#26332f]">
              {t.agenda}
            </h1>
            <p className="mt-2 text-sm text-[#687874]">{t.agendaSubtitle}</p>
          </div>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-3">
          {scopes.map((scope) => {
            const Icon = scope.icon;
            const meta = scopeMeta(scope.key);
            const isActive = activeScope === scope.key;

            return (
              <button
                className={`agenda-card min-h-28 rounded-lg border p-4 text-left transition ${
                  isActive
                    ? "border-[#7da69c] bg-white/78 shadow-sm"
                    : "border-[#d5e2de] bg-white/46 hover:border-[#9bb8b0] hover:bg-white/62"
                }`}
                key={scope.key}
                onClick={() => setActiveScope(scope.key)}
                type="button"
              >
                <span className="mb-4 flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-lg bg-[#e8f1ee] text-[#1e2a27]">
                    <Icon size={18} />
                  </span>
                  <span className="rounded-full bg-[#e8f1ee] px-2.5 py-1 text-xs font-medium text-[#596965]">
                    {meta.done}/{meta.total}
                  </span>
                </span>
                <span className="block text-xl font-semibold text-[#26332f]">
                  {scope.label}
                </span>
                <span className="mt-2 block text-sm text-[#687874]">
                  {scope.key === "yearly"
                    ? `${writtenDayCount} ${locale === "tr" ? "gün notu" : "day notes"}`
                    : meta.noteReady
                      ? locale === "tr"
                        ? "Not hazır"
                        : "Note ready"
                      : locale === "tr"
                        ? "Henüz boş"
                        : "Empty"}
                </span>
              </button>
            );
          })}
        </div>

        {activeScope === "yearly" && (
          <section className="agenda-panel mb-5 rounded-lg border border-[#d5e2de] bg-white/55 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#43524e]">
                  <CalendarRange size={17} />
                  {selectedYear}
                </div>
                <p className="mt-1 text-xs text-[#687874]">
                  {t.yearlyCalendarHint}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 self-start rounded-lg border border-[#d5e2de] bg-white/70 p-1">
                <button
                  aria-label={t.previousYear}
                  className="grid size-8 place-items-center rounded-md text-[#596965] transition hover:bg-[#e8f1ee] hover:text-[#26332f]"
                  onClick={() => {
                    const nextYear = selectedYear - 1;
                    setSelectedYear(nextYear);
                    setSelectedDate(`${nextYear}-01-01`);
                  }}
                  type="button"
                >
                  ‹
                </button>
                <span className="min-w-16 text-center text-sm font-semibold text-[#26332f]">
                  {selectedYear}
                </span>
                <button
                  aria-label={t.nextYear}
                  className="grid size-8 place-items-center rounded-md text-[#596965] transition hover:bg-[#e8f1ee] hover:text-[#26332f]"
                  onClick={() => {
                    const nextYear = selectedYear + 1;
                    setSelectedYear(nextYear);
                    setSelectedDate(`${nextYear}-01-01`);
                  }}
                  type="button"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="agenda-year-grid grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
              {monthIndexes.map((monthIndex) => {
                const offset = calendarOffset(selectedYear, monthIndex, locale);
                const days = daysInMonth(selectedYear, monthIndex);

                return (
                  <div
                    className="rounded-lg border border-[#d5e2de] bg-white/36 p-3"
                    key={monthIndex}
                  >
                    <h2 className="mb-3 text-sm font-semibold capitalize text-[#43524e]">
                      {monthName(selectedYear, monthIndex, locale)}
                    </h2>
                    <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#82908c]">
                      {weekDays.map((weekday) => (
                        <span key={`${monthIndex}-${weekday}`}>{weekday}</span>
                      ))}
                    </div>
                    <div className="mt-1 grid grid-cols-7 gap-1">
                      {Array.from({ length: offset }).map((_, index) => (
                        <span
                          aria-hidden="true"
                          className="aspect-square"
                          key={`offset-${monthIndex}-${index}`}
                        />
                      ))}
                      {Array.from({ length: days }, (_, dayIndex) => {
                        const day = dayIndex + 1;
                        const key = `${selectedYear}-${`${monthIndex + 1}`.padStart(2, "0")}-${`${day}`.padStart(2, "0")}`;
                        const hasNote = Boolean(dayNotes[key]?.trim());
                        const isSelected = selectedDate === key;

                        return (
                          <button
                            className={`relative aspect-square rounded-md text-xs font-medium transition ${
                              isSelected
                                ? "bg-[#1e2a27] text-white"
                                : hasNote
                                  ? "bg-[#dcebe6] text-[#1e2a27] hover:bg-[#cfe2db]"
                                  : "text-[#596965] hover:bg-[#e8f1ee] hover:text-[#26332f]"
                            }`}
                            key={key}
                            onClick={() => setSelectedDate(key)}
                            type="button"
                          >
                            {day}
                            {hasNote && (
                              <span
                                className={`absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full ${
                                  isSelected ? "bg-white" : "bg-[#0f8a68]"
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="agenda-panel rounded-lg border border-[#d5e2de] bg-white/55 p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#43524e]">
                <FileText size={17} />
                {activeScope === "yearly"
                  ? `${t.selectedDay}: ${formatAgendaDate(selectedDate, locale)}`
                  : scopes.find((scope) => scope.key === activeScope)?.label}
              </div>
              <span className="rounded-full bg-[#e8f1ee] px-3 py-1 text-xs font-medium text-[#596965]">
                {completedItems}/{activePlan.items.length}{" "}
                {locale === "tr" ? "tamamlandı" : "done"}
              </span>
            </div>
            <textarea
              className="note-textarea min-h-[340px] w-full resize-none bg-transparent text-lg leading-8 outline-none placeholder:text-[#9eaca8]"
              onChange={(event) =>
                activeScope === "yearly"
                  ? onUpdateDayNote(selectedDate, event.target.value)
                  : onUpdateNote(activeScope, event.target.value)
              }
              placeholder={t.agendaNotePlaceholder[activeScope]}
              value={activeScope === "yearly" ? selectedDayNote : activePlan.note}
            />
          </section>

          <section className="agenda-panel rounded-lg border border-[#d5e2de] bg-white/55 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#43524e]">
                <CheckSquare size={17} />
                {t.agendaItems}
              </div>
              <button
                className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cfdcd8] bg-white/70 px-3 text-xs font-medium text-[#596965] transition hover:border-[#9bb8b0] hover:bg-white"
                onClick={() => onAddItem(activeScope)}
                type="button"
              >
                <Plus size={14} />
                {t.addAgendaItem}
              </button>
            </div>

            <div className="max-h-[430px] space-y-2 overflow-y-auto pr-1">
              {(activePlan.items.length ? activePlan.items : []).map((item) => (
                <div
                  className="group flex min-h-12 items-center gap-3 rounded-lg border border-[#dce8e4] bg-white/38 px-2 transition hover:border-[#c8d8d3] hover:bg-white/58"
                  key={item.id}
                >
                  <button
                    aria-label={t.toggleBlock}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[#7b8b87] transition hover:bg-[#e8f1ee] hover:text-[#0f8a68]"
                    onClick={() => onToggleItem(activeScope, item.id)}
                    type="button"
                  >
                    <CheckSquare
                      className={item.done ? "text-[#0f8a68]" : ""}
                      size={18}
                    />
                  </button>
                  <input
                    className={`min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[#9eaca8] ${
                      item.done ? "text-[#879591] line-through" : ""
                    }`}
                    onChange={(event) =>
                      onUpdateItem(activeScope, item.id, event.target.value)
                    }
                    placeholder={t.agendaEmptyItem}
                    value={item.text}
                  />
                  <button
                    aria-label={t.deleteAgendaItem}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-[#9aa8a4] opacity-0 transition hover:bg-[#fde8e5] hover:text-[#b42318] group-hover:opacity-100 focus:opacity-100"
                    onClick={() => onDeleteItem(activeScope, item.id)}
                    type="button"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {activePlan.items.length === 0 && (
                <button
                  className="flex min-h-14 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#cfdcd8] bg-transparent text-sm font-medium text-[#687874] transition hover:border-[#9bb8b0] hover:text-[#26332f]"
                  onClick={() => onAddItem(activeScope)}
                  type="button"
                >
                  <Plus size={16} />
                  {t.agendaNewItem}
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function authErrorMessage(message: string, t: Translation) {
  const normalizedMessage = message.toLocaleLowerCase("en-US");

  if (
    normalizedMessage.includes("invalid login credentials") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return t.authInvalidCredentials;
  }

  if (
    normalizedMessage.includes("email not confirmed") ||
    normalizedMessage.includes("not confirmed")
  ) {
    return t.authEmailNotConfirmed;
  }

  if (
    normalizedMessage.includes("password") &&
    normalizedMessage.includes("6")
  ) {
    return t.authPasswordShort;
  }

  return t.authGenericError;
}

function AuthPanel({
  locale,
  theme,
  t,
  onAuthChange,
  onLocaleChange,
  onThemeChange,
}: {
  locale: Locale;
  theme: Theme;
  t: Translation;
  onAuthChange: (session: Session | null) => void;
  onLocaleChange: (locale: Locale) => void;
  onThemeChange: (theme: Theme) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setMessage(t.authEmailRequired);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setMessage(t.authEmailInvalid);
      return;
    }

    if (!password) {
      setMessage(t.authPasswordRequired);
      return;
    }

    if (password.length < 6) {
      setMessage(t.authPasswordShort);
      return;
    }

    const normalizedPhone = phone.trim();
    setMessage("");
    setIsSubmitting(true);

    try {
      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            })
          : await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: normalizedPhone
                ? {
                    data: {
                      phone: normalizedPhone,
                    },
                  }
                : undefined,
            });

      setIsSubmitting(false);

      if (result.error) {
        setMessage(authErrorMessage(result.error.message, t));
        return;
      }

      onAuthChange(result.data.session);
      if (mode === "sign-up") {
        setMessage(t.authSuccess);
      }
    } catch {
      setIsSubmitting(false);
      setMessage(t.authConnectionError);
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

        <form className="space-y-3" noValidate onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#43524e]">
            {t.email}
            <input
              className="auth-input mt-1 h-11 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-3 outline-none focus:border-[#7da69c]"
              dir="ltr"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              type="text"
              value={email}
            />
          </label>
          {mode === "sign-up" && (
            <label className="block text-sm font-medium text-[#43524e]">
              {t.phone}
              <div className="relative mt-1">
                <Phone
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8d88]"
                  size={17}
                />
                <input
                  className="auth-input h-11 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-10 outline-none focus:border-[#7da69c]"
                  dir="ltr"
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  type="tel"
                  value={phone}
                />
              </div>
            </label>
          )}
          <label className="block text-sm font-medium text-[#43524e]">
            {t.password}
            <div className="relative mt-1">
              <input
                className="auth-input h-11 w-full rounded-lg border border-[#d5e2de] bg-[#fbfefd] px-3 pr-11 outline-none focus:border-[#7da69c]"
                onChange={(event) => setPassword(event.target.value)}
                type={isPasswordVisible ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={isPasswordVisible ? t.hidePassword : t.showPassword}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-[#6f7f7b] transition hover:bg-[#e8f1ee] hover:text-[#26332f]"
                onClick={() =>
                  setIsPasswordVisible((currentValue) => !currentValue)
                }
                type="button"
              >
                {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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

        <div className="auth-preferences mt-5 space-y-3 rounded-lg border border-[#d5e2de] bg-[#fbfefd] p-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#596965]">
              <Languages size={15} />
              {t.language}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["tr", "en"] as const).map((option) => (
                <button
                  aria-pressed={locale === option}
                  className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
                    locale === option
                      ? "border-[#7da69c] bg-[#e8f1ee] text-[#1e2a27]"
                      : "border-[#d5e2de] bg-white text-[#6b7a76] hover:border-[#9bb8b0]"
                  }`}
                  key={option}
                  onClick={() => onLocaleChange(option)}
                  type="button"
                >
                  {option === "tr" ? t.turkish : t.english}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#596965]">
              <Settings size={15} />
              {t.theme}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((option) => (
                <button
                  aria-pressed={theme === option}
                  className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
                    theme === option
                      ? "border-[#7da69c] bg-[#e8f1ee] text-[#1e2a27]"
                      : "border-[#d5e2de] bg-white text-[#6b7a76] hover:border-[#9bb8b0]"
                  }`}
                  key={option}
                  onClick={() => onThemeChange(option)}
                  type="button"
                >
                  {option === "light" ? t.lightTheme : t.darkTheme}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function serializeTable(rows: string[][]) {
  return rows.map((row) => row.join("\t")).join("\n");
}

function freshTableBlock(headers: string[], rowCount = 3): NoteBlock {
  const safeRowCount = Math.max(1, rowCount);
  const rows = [
    headers,
    ...Array.from({ length: safeRowCount }, () =>
      Array.from({ length: headers.length }, () => ""),
    ),
  ];

  return {
    id: createId("block"),
    type: "table",
    content: serializeTable(rows),
  };
}

function freshBlock(type: BlockType = "paragraph"): NoteBlock {
  if (type === "table") {
    return freshTableBlock(["Alan", "Durum", "Not"], 3);
  }

  return {
    id: createId("block"),
    type,
    content: type === "list" ? "• " : "",
    checked: type === "todo" ? false : undefined,
    checkedLines: type === "todo" ? [false] : undefined,
  };
}

function freshLocalizedBlock(type: BlockType, locale: Locale) {
  if (type === "table") {
    return freshTableBlock(
      locale === "tr"
        ? ["Alan", "Hedef", "Durum"]
        : ["Area", "Goal", "Status"],
      3,
    );
  }

  return freshBlock(type);
}

function createTemplateBlocks(templateId: TemplateId, locale: Locale) {
  const isTurkish = locale === "tr";
  const tableHeaders: Partial<Record<TemplateId, string[]>> = {
    diet: isTurkish
      ? ["Gün", "Öğün", "Hedef", "Not"]
      : ["Day", "Meal", "Goal", "Note"],
    emptyDatabase: isTurkish
      ? ["Alan", "Değer", "Durum"]
      : ["Field", "Value", "Status"],
    finance: isTurkish
      ? ["Kalem", "Tutar", "Tür", "Durum"]
      : ["Item", "Amount", "Type", "Status"],
    goals: isTurkish
      ? ["Hedef", "Ölçüm", "Son tarih", "Durum"]
      : ["Goal", "Metric", "Due date", "Status"],
    habits: isTurkish
      ? ["Alışkanlık", "Sıklık", "Bu hafta", "Not"]
      : ["Habit", "Rhythm", "This week", "Note"],
    projects: isTurkish
      ? ["Proje", "Aşama", "Sorumlu", "Sonraki adım"]
      : ["Project", "Stage", "Owner", "Next step"],
    study: isTurkish
      ? ["Konu", "Kaynak", "Tekrar", "Durum"]
      : ["Topic", "Resource", "Review", "Status"],
    tasks: isTurkish
      ? ["Görev", "Öncelik", "Tarih", "Durum"]
      : ["Task", "Priority", "Date", "Status"],
  };

  if (templateId === "emptyPage") {
    return [freshBlock("paragraph")];
  }

  if (templateId === "brainstorm") {
    return [freshTableBlock(isTurkish ? ["Fikir", "Etki", "Sonraki adım"] : ["Idea", "Impact", "Next step"], 4)];
  }

  if (templateId === "docs") {
    return [freshTableBlock(isTurkish ? ["Doküman", "Sahip", "Durum", "Güncelleme"] : ["Document", "Owner", "Status", "Update"], 4)];
  }

  const headers = tableHeaders[templateId];
  return headers ? [freshTableBlock(headers, 4)] : [freshLocalizedBlock("table", locale)];
}

function defaultTableRows(locale: Locale) {
  const headers =
    locale === "tr" ? ["Alan", "Hedef", "Durum"] : ["Area", "Goal", "Status"];

  return [
    headers,
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ];
}

function localizeDefaultTableRows(rows: string[][], locale: Locale) {
  if (
    locale === "en" &&
    rows[0]?.join("\t") === "Alan\tDurum\tNot"
  ) {
    return [["Area", "Status", "Note"], ...rows.slice(1)];
  }

  if (
    locale === "en" &&
    rows[0]?.join("\t") === "Alan\tHedef\tDurum"
  ) {
    return [["Area", "Goal", "Status"], ...rows.slice(1)];
  }

  return rows;
}

function parseTable(content: string, locale: Locale) {
  if (content.trim() === "") {
    return defaultTableRows(locale);
  }

  const rows = content.split("\n").map((row) => row.split("\t"));
  const normalizedRows = localizeDefaultTableRows(rows, locale);

  const columnCount = Math.max(2, ...normalizedRows.map((row) => row.length));
  const paddedRows = normalizedRows.map((row) => [
    ...row,
    ...Array.from({ length: columnCount - row.length }, () => ""),
  ]);

  if (paddedRows.length === 1) {
    return [
      paddedRows[0],
      ...Array.from({ length: 3 }, () =>
        Array.from({ length: columnCount }, () => ""),
      ),
    ];
  }

  return paddedRows;
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

function normalizeAgenda(value: unknown): AgendaState {
  const source = value as Partial<Record<AgendaScope, Partial<AgendaPlan>>>;

  return {
    daily: normalizeAgendaPlan(source?.daily),
    monthly: normalizeAgendaPlan(source?.monthly),
    yearly: normalizeAgendaPlan(source?.yearly),
  };
}

function normalizeAgendaPlan(plan?: Partial<AgendaPlan>): AgendaPlan {
  const dayNotes =
    plan?.dayNotes && typeof plan.dayNotes === "object"
      ? Object.fromEntries(
          Object.entries(plan.dayNotes).filter(
            ([key, value]) => key && typeof value === "string",
          ),
        )
      : {};

  return {
    note: typeof plan?.note === "string" ? plan.note : "",
    items: Array.isArray(plan?.items)
      ? plan.items.map((item) => ({
          id:
            typeof item.id === "string" && item.id
              ? item.id
              : createId("agenda-item"),
          text: typeof item.text === "string" ? item.text : "",
          done: Boolean(item.done),
        }))
      : [],
    dayNotes,
  };
}

function extractAgenda(pages: NotePage[]) {
  const agendaPage = pages.find((page) => page.system === "agenda");
  if (!agendaPage?.blocks[0]?.content) {
    return defaultAgenda;
  }

  try {
    return normalizeAgenda(JSON.parse(agendaPage.blocks[0].content));
  } catch {
    return defaultAgenda;
  }
}

function parseStoredAgenda(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return normalizeAgenda(JSON.parse(value));
  } catch {
    return null;
  }
}

function withoutSystemPages(pages: NotePage[]) {
  return pages.filter((page) => !page.system);
}

function pagesWithAgenda(pages: NotePage[], agenda: AgendaState): NotePage[] {
  return [
    ...withoutSystemPages(pages),
    {
      id: "system-agenda",
      title: "Agenda data",
      emoji: "📅",
      updatedAt: new Date().toISOString(),
      system: "agenda",
      blocks: [
        {
          id: "system-agenda-data",
          type: "paragraph",
          content: JSON.stringify(agenda),
        },
      ],
    },
  ];
}

function createWorkspaceSnapshot(
  pages: NotePage[],
  locale: Locale,
  theme: Theme,
  agenda: AgendaState,
) {
  return JSON.stringify({ agenda, locale, pages, theme });
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
  const [agenda, setAgenda] = useState<AgendaState>(defaultAgenda);
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    supabase ? "loading" : "local",
  );
  const [authReady, setAuthReady] = useState(() => !supabase);
  const [query, setQuery] = useState("");
  const cleanupReadyRef = useRef(false);
  const remoteReadyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const lastRemoteSnapshotRef = useRef("");
  const storageReadyRef = useRef(false);

  const t = translations[locale];
  const syncLabel =
    syncStatus === "saving"
      ? t.saving
      : syncStatus === "error"
        ? t.syncError
        : syncStatus === "local"
          ? t.localOnly
          : t.saved;

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem("notion-lite-pages");
        const savedLocale = window.localStorage.getItem("notion-lite-locale");
        const savedTheme = window.localStorage.getItem("notion-lite-theme");
        const savedAgenda = window.localStorage.getItem("notion-lite-agenda");

        if (savedLocale === "tr" || savedLocale === "en") {
          setLocale(savedLocale);
        }

        if (savedTheme === "light" || savedTheme === "dark") {
          setTheme(savedTheme);
        }

        if (saved !== null) {
          const storedPages = JSON.parse(saved) as NotePage[];
          const visiblePages = withoutSystemPages(storedPages).map(
            removeGeneratedTemplateBlocks,
          );
          setAgenda(parseStoredAgenda(savedAgenda) ?? extractAgenda(storedPages));
          setPages(visiblePages);
          setActivePageId(visiblePages[0]?.id ?? "");
        } else if (savedAgenda) {
          setAgenda(parseStoredAgenda(savedAgenda) ?? defaultAgenda);
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
      const cleanedPages = withoutSystemPages(currentPages).map(
        removeGeneratedTemplateBlocks,
      );
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

    const authClient = supabase;
    let isMounted = true;

    async function loadSession() {
      try {
        const { data } = await authClient.auth.getSession();
        if (isMounted) {
          setSession(data.session);
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setSyncStatus("local");
        }
      } finally {
        if (isMounted) {
          setAuthReady(true);
        }
      }
    }

    void loadSession();

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      remoteReadyRef.current = false;
      lastRemoteSnapshotRef.current = "";
      setSession(nextSession);
      setSyncStatus(nextSession ? "loading" : "local");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session || !storageReadyRef.current || remoteReadyRef.current) {
      return;
    }

    const syncClient = supabase;
    const userId = session.user.id;
    let isMounted = true;
    setSyncStatus("loading");

    async function syncInitialWorkspace() {
      try {
        const remoteWorkspace = await loadWorkspace<NotePage>(
          syncClient,
          userId,
        );

        if (!isMounted) {
          return;
        }

        if (remoteWorkspace?.pages?.length) {
          const remotePages = withoutSystemPages(remoteWorkspace.pages).map(
            removeGeneratedTemplateBlocks,
          );
          const remoteAgenda = extractAgenda(remoteWorkspace.pages);
          setPages(remotePages);
          setAgenda(remoteAgenda);
          setActivePageId(remotePages[0]?.id ?? "");
          setLocale(remoteWorkspace.locale);
          setTheme(remoteWorkspace.theme);
          lastRemoteSnapshotRef.current = createWorkspaceSnapshot(
            remotePages,
            remoteWorkspace.locale,
            remoteWorkspace.theme,
            remoteAgenda,
          );
        } else {
          await saveWorkspace(syncClient, userId, {
            locale,
            pages: pagesWithAgenda(pages, agenda),
            theme,
          });
          lastRemoteSnapshotRef.current = createWorkspaceSnapshot(
            pages,
            locale,
            theme,
            agenda,
          );
        }

        remoteReadyRef.current = true;
        setSyncStatus("saved");
      } catch {
        remoteReadyRef.current = false;
        setSyncStatus("error");
      }
    }

    void syncInitialWorkspace();

    return () => {
      isMounted = false;
    };
  }, [agenda, locale, pages, session, supabase, theme]);

  useEffect(() => {
    if (storageReadyRef.current) {
      window.localStorage.setItem("notion-lite-pages", JSON.stringify(pages));
      window.localStorage.setItem("notion-lite-agenda", JSON.stringify(agenda));
      window.localStorage.setItem("notion-lite-locale", locale);
      window.localStorage.setItem("notion-lite-theme", theme);
    }
  }, [agenda, locale, pages, theme]);

  useEffect(() => {
    if (!supabase || !session || !remoteReadyRef.current) {
      return;
    }

    const syncClient = supabase;
    const userId = session.user.id;
    const snapshot = createWorkspaceSnapshot(pages, locale, theme, agenda);
    if (snapshot === lastRemoteSnapshotRef.current) {
      return;
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    setSyncStatus("saving");
    saveTimerRef.current = window.setTimeout(() => {
      saveWorkspace(syncClient, userId, {
        locale,
        pages: pagesWithAgenda(pages, agenda),
        theme,
      })
        .then(() => {
          lastRemoteSnapshotRef.current = snapshot;
          setSyncStatus("saved");
        })
        .catch(() => {
          setSyncStatus("error");
        });
    }, 700);

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [agenda, locale, pages, session, supabase, theme]);

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

  function updateAgendaPlan(
    scope: AgendaScope,
    updater: (plan: AgendaPlan) => AgendaPlan,
  ) {
    setAgenda((currentAgenda) => ({
      ...currentAgenda,
      [scope]: updater(currentAgenda[scope]),
    }));
  }

  function updateAgendaNote(scope: AgendaScope, note: string) {
    updateAgendaPlan(scope, (plan) => ({ ...plan, note }));
  }

  function updateAgendaDayNote(date: string, note: string) {
    updateAgendaPlan("yearly", (plan) => ({
      ...plan,
      dayNotes: {
        ...(plan.dayNotes ?? {}),
        [date]: note,
      },
    }));
  }

  function addAgendaItem(scope: AgendaScope) {
    updateAgendaPlan(scope, (plan) => ({
      ...plan,
      items: [
        ...plan.items,
        { id: createId("agenda-item"), text: "", done: false },
      ],
    }));
  }

  function updateAgendaItem(scope: AgendaScope, itemId: string, text: string) {
    updateAgendaPlan(scope, (plan) => ({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, text } : item,
      ),
    }));
  }

  function toggleAgendaItem(scope: AgendaScope, itemId: string) {
    updateAgendaPlan(scope, (plan) => ({
      ...plan,
      items: plan.items.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }));
  }

  function deleteAgendaItem(scope: AgendaScope, itemId: string) {
    updateAgendaPlan(scope, (plan) => ({
      ...plan,
      items: plan.items.filter((item) => item.id !== itemId),
    }));
  }

  function updateBlock(blockId: string, patch: Partial<NoteBlock>) {
    updateActivePage((page) => ({
      ...page,
      blocks: page.blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  }

  function updateTableCell(
    block: NoteBlock,
    rowIndex: number,
    columnIndex: number,
    value: string,
  ) {
    const rows = parseTable(block.content, locale);
    rows[rowIndex][columnIndex] = value;
    updateBlock(block.id, { content: serializeTable(rows) });
  }

  function addTableRow(block: NoteBlock) {
    const rows = parseTable(block.content, locale);
    const columnCount = rows[0]?.length ?? 3;
    rows.push(Array.from({ length: columnCount }, () => ""));
    updateBlock(block.id, { content: serializeTable(rows) });
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
            block.id === afterBlockId
              ? [block, freshLocalizedBlock(type, locale)]
              : [block],
          )
        : [...page.blocks, freshLocalizedBlock(type, locale)],
    }));
    setOpenBlockMenu(null);
  }

  function applyTemplate(templateId: TemplateId) {
    const templates = templateCopy[locale];
    const selectedTemplate =
      templates.quick.find((template) => template.id === templateId) ??
      templates.suggestedItems.find((template) => template.id === templateId);

    const nextBlocks = createTemplateBlocks(templateId, locale);

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
                : templateId === "diet"
                  ? "🥗"
                  : templateId === "goals"
                    ? "🎯"
                    : templateId === "habits"
                      ? "📅"
                      : templateId === "finance"
                        ? "💳"
                        : templateId === "study"
                          ? "📚"
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

    try {
      await supabase.auth.signOut();
    } catch {
      // Keep the local UI responsive even if Supabase is temporarily unreachable.
    }
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
    return (
      <AuthPanel
        locale={locale}
        onAuthChange={setSession}
        onLocaleChange={setLocale}
        onThemeChange={setTheme}
        t={t}
        theme={theme}
      />
    );
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
                <p className="text-sm font-semibold">TreeNote</p>
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
                activeView === "agenda"
                  ? "border-[#9bb8b0] bg-white"
                  : "border-[#d5e2de] bg-white"
              }`}
              onClick={() => {
                setActiveView("agenda");
                setSettingsOpen(false);
              }}
              type="button"
            >
              <span className="flex items-center gap-2 font-medium text-[#43524e]">
                <CalendarDays size={16} />
                {t.agenda}
              </span>
              <CalendarRange size={16} className="text-[#7b8b87]" />
            </button>

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

        {activeView === "agenda" ? (
          <AgendaView
            agenda={agenda}
            locale={locale}
            onAddItem={addAgendaItem}
            onDeleteItem={deleteAgendaItem}
            onUpdateDayNote={updateAgendaDayNote}
            onToggleItem={toggleAgendaItem}
            onUpdateItem={updateAgendaItem}
            onUpdateNote={updateAgendaNote}
            t={t}
          />
        ) : activeView === "templates" ? (
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
                <Circle
                  size={10}
                  fill={syncStatus === "error" ? "#d89a2b" : "#14a37f"}
                  strokeWidth={0}
                />
                {syncLabel}
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
                      ) : block.type === "table" ? (
                        <>
                          <span className="mt-2 grid size-6 place-items-center rounded-md text-[#7b8b87]">
                            <Icon size={16} />
                          </span>

                          <div className="col-start-3 col-end-5 pr-9">
                            <div className="note-table-shell overflow-x-auto rounded-lg border border-[#d5e2de] bg-transparent">
                              <div className="min-w-[560px]">
                                {parseTable(block.content, locale).map(
                                  (row, rowIndex) => (
                                    <div
                                      className={`grid border-b border-[#dce8e4] last:border-b-0`}
                                      key={`${block.id}-${rowIndex}`}
                                      style={{
                                        gridTemplateColumns: `repeat(${row.length}, minmax(130px, 1fr))`,
                                      }}
                                    >
                                      {row.map((cell, columnIndex) => (
                                        <input
                                          className={`note-table-input min-h-11 border-r border-[#dce8e4] bg-transparent px-3 text-sm outline-none last:border-r-0 placeholder:text-[#9eaca8] ${
                                            rowIndex === 0
                                              ? "font-semibold text-[#43524e]"
                                              : "text-[#26332f]"
                                          }`}
                                          key={`${block.id}-${rowIndex}-${columnIndex}`}
                                          onChange={(event) =>
                                            updateTableCell(
                                              block,
                                              rowIndex,
                                              columnIndex,
                                              event.target.value,
                                            )
                                          }
                                          placeholder={
                                            rowIndex === 0
                                              ? t.blockPlaceholder.table
                                              : ""
                                          }
                                          value={cell}
                                        />
                                      ))}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                            <button
                              className="mt-2 inline-flex h-8 items-center gap-2 rounded-md border border-[#cfdcd8] bg-white/70 px-3 text-xs font-medium text-[#596965] transition hover:border-[#9bb8b0] hover:bg-white"
                              onClick={() => addTableRow(block)}
                              type="button"
                            >
                              <Plus size={14} />
                              {t.addTableRow}
                            </button>
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
