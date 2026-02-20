import { useState, useEffect, useCallback, useMemo } from "react";
import books from "./books/index.js";

const STATUS_COLORS = {
  unread: { bg: "#1a1e28", border: "#2a3040", text: "#8a92a8", icon: "○" },
  reading: { bg: "#1a2818", border: "#2a4828", text: "#5cc05c", icon: "◎" },
  done: { bg: "#182030", border: "#284060", text: "#5a9ee0", icon: "●" },
  reviewed: { bg: "#241a30", border: "#402868", text: "#aa80e0", icon: "◆" },
};

const STATUS_LABELS = {
  unread: "未読",
  reading: "読書中",
  done: "読了",
  reviewed: "復習済",
};

const STATUS_ORDER = ["unread", "reading", "done", "reviewed"];

function storageKey(bookId, key) {
  return `st-${bookId}-${key}`;
}

function loadJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function stars(n) {
  return "█".repeat(n) + "░".repeat(5 - n);
}

/* ── Sidebar ── */
function Sidebar({ books, currentId, onSelect, open, onClose }) {
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    return [...new Set(books.map((b) => b.category).filter(Boolean))];
  }, [books]);

  const filtered = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author && b.author.toLowerCase().includes(q)) ||
        (b.subtitle && b.subtitle.toLowerCase().includes(q))
    );
  }, [books, search]);

  const booksByCategory = categories.map((cat) => ({
    category: cat,
    items: books.filter((b) => b.category === cat),
  }));
  const uncategorized = books.filter((b) => !b.category);

  const handleSelect = (id) => {
    onSelect(id);
    setSearch("");
    onClose();
  };

  const renderBookItem = (b) => {
    const active = b.id === currentId;
    return (
      <button
        key={b.id}
        onClick={() => handleSelect(b.id)}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          background: active ? "#1e2538" : "transparent",
          border: "none",
          borderLeft: active ? "3px solid #4a90d9" : "3px solid transparent",
          color: active ? "#e2e6ed" : "#a0a8b8",
          fontSize: 13,
          padding: "9px 12px",
          cursor: "pointer",
          fontFamily: "'Noto Sans JP'",
          transition: "all 0.1s",
          lineHeight: 1.4,
        }}
      >
        <div>{b.title}</div>
        {b.author && <div style={{ fontSize: 11, color: "#7a8098", marginTop: 2 }}>{b.author}</div>}
      </button>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 99,
            display: "none",
          }}
          className="sidebar-overlay"
        />
      )}
      <aside
        style={{
          width: 240,
          minWidth: 240,
          background: "#181c28",
          borderRight: "1px solid #252a38",
          height: "100vh",
          position: "sticky",
          top: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
        className={`sidebar ${open ? "sidebar-open" : ""}`}
      >
        {/* Logo / title */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid #252a38" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e6ed", fontFamily: "IBM Plex Mono" }}>
            Study Tracker
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 12px" }}>
          <input
            type="text"
            placeholder="検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#1c2030",
              border: "1px solid #303648",
              color: "#bcc3d0",
              fontSize: 13,
              padding: "7px 10px",
              borderRadius: 6,
              fontFamily: "'Noto Sans JP'",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Book list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered ? (
            <div>
              {filtered.length === 0 && (
                <div style={{ fontSize: 12, color: "#7a8098", padding: "10px 14px" }}>該当なし</div>
              )}
              {filtered.map(renderBookItem)}
            </div>
          ) : (
            <div>
              {booksByCategory.map(({ category, items }) => (
                <div key={category}>
                  <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "#7a8098", letterSpacing: 1, padding: "12px 14px 4px", textTransform: "uppercase" }}>
                    {category}
                  </div>
                  {items.map(renderBookItem)}
                </div>
              ))}
              {uncategorized.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "#7a8098", letterSpacing: 1, padding: "12px 14px 4px" }}>
                    OTHER
                  </div>
                  {uncategorized.map(renderBookItem)}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

/* ── Main App ── */
export default function App() {
  const [currentBookId, setCurrentBookId] = useState(
    () => loadJSON("st-current-book", null) || books[0].id
  );
  const book = books.find((b) => b.id === currentBookId) || books[0];
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [sectionStatus, setSectionStatus] = useState(
    () => loadJSON(storageKey(book.id, "status"), {})
  );
  const [chapterNotes, setChapterNotes] = useState(
    () => loadJSON(storageKey(book.id, "notes"), {})
  );
  const [activeTab, setActiveTab] = useState("chapters");
  const [expandedChapter, setExpandedChapter] = useState(null);
  const [startDate, setStartDate] = useState(
    () => loadJSON(storageKey(book.id, "date"), null) || book.defaultStartDate
  );

  const selectBook = useCallback((id) => {
    saveJSON("st-current-book", id);
    setCurrentBookId(id);
    setExpandedChapter(null);
    setActiveTab("chapters");
  }, []);

  useEffect(() => {
    setSectionStatus(loadJSON(storageKey(book.id, "status"), {}));
    setChapterNotes(loadJSON(storageKey(book.id, "notes"), {}));
    setStartDate(loadJSON(storageKey(book.id, "date"), null) || book.defaultStartDate);
  }, [book.id, book.defaultStartDate]);

  useEffect(() => { saveJSON(storageKey(book.id, "status"), sectionStatus); }, [sectionStatus, book.id]);
  useEffect(() => { saveJSON(storageKey(book.id, "notes"), chapterNotes); }, [chapterNotes, book.id]);
  useEffect(() => { saveJSON(storageKey(book.id, "date"), startDate); }, [startDate, book.id]);

  const cycleStatus = useCallback((sectionId) => {
    setSectionStatus((prev) => {
      const current = prev[sectionId] || "unread";
      const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
      return { ...prev, [sectionId]: next };
    });
  }, []);

  const getChapterProgress = useCallback(
    (chapter) => {
      const total = chapter.sections.length;
      const done = chapter.sections.filter((s) => {
        const st = sectionStatus[s.id] || "unread";
        return st === "done" || st === "reviewed";
      }).length;
      return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
    },
    [sectionStatus]
  );

  const allSections = book.chapters.flatMap((c) => c.sections);
  const totalDone = allSections.filter((s) => {
    const st = sectionStatus[s.id] || "unread";
    return st === "done" || st === "reviewed";
  }).length;
  const totalPct = Math.round((totalDone / allSections.length) * 100);
  const pagesRead = book.chapters.reduce((acc, ch) => {
    const chDone = ch.sections.filter((s) => {
      const st = sectionStatus[s.id] || "unread";
      return st === "done" || st === "reviewed";
    });
    return acc + chDone.reduce((a, s) => a + (s.endPage - s.startPage + 1), 0);
  }, 0);

  const getCurrentWeek = () => {
    if (!book.weekCount) return 0;
    const start = new Date(startDate);
    const now = new Date();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, Math.min(diff + 1, book.weekCount));
  };

  const hasWeekPlan = book.weekPlan && book.weekPlan.length > 0;
  const hasExamInfo =
    book.examInfo &&
    ((book.examInfo.frequentTopics && book.examInfo.frequentTopics.length > 0) ||
      (book.examInfo.relatedExams && book.examInfo.relatedExams.length > 0));

  const tabs = [{ key: "chapters", label: "章別" }];
  if (hasWeekPlan) tabs.push({ key: "weekly", label: "週間" });
  if (hasExamInfo) tabs.push({ key: "exams", label: "過去問" });

  return (
    <div style={{ display: "flex", background: "#131620", color: "#bcc3d0", minHeight: "100vh", fontFamily: "'Noto Sans JP', sans-serif" }}>
      {/* Sidebar */}
      {books.length > 1 && (
        <Sidebar
          books={books}
          currentId={currentBookId}
          onSelect={selectBook}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Mobile hamburger */}
        {books.length > 1 && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
            style={{
              display: "none",
              position: "fixed",
              top: 12,
              left: 12,
              zIndex: 98,
              background: "#181c28",
              border: "1px solid #303648",
              color: "#a0a8b8",
              fontSize: 18,
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "IBM Plex Mono",
            }}
          >
            ☰
          </button>
        )}

        {/* === HEADER === */}
        <div style={{ background: "linear-gradient(180deg, #1c2030 0%, #131620 100%)", borderBottom: "1px solid #2a2f3e", padding: "24px 20px 22px" }}>
          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {book.subtitle && (
              <div style={{ fontSize: 12, fontFamily: "IBM Plex Mono", color: "#4a7ab0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
                {book.subtitle}
              </div>
            )}
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#e2e6ed", margin: "0 0 4px", lineHeight: 1.3 }}>
              {book.title}
              {(book.author || book.edition) && (
                <span style={{ fontWeight: 300, color: "#a0a0a8", fontSize: 17, marginLeft: 10 }}>
                  {book.author} {book.edition}
                </span>
              )}
            </h1>
            <div style={{ fontSize: 13, color: "#a0a8b8", margin: "8px 0 16px", fontFamily: "IBM Plex Mono" }}>
              {book.chapters.length}章 · {allSections.length}節{book.totalPages > 0 && ` · ${book.totalPages}頁`}
              {book.weekCount > 0 && ` · ${book.weekCount}週間プラン`}
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
              <StatBox label="進捗" value={totalPct} suffix="%" color={totalPct === 100 ? "#4ead4e" : "#4a90d9"} />
              <StatBox label="節" value={totalDone} suffix={`/ ${allSections.length}`} />
              {book.totalPages > 0 && <StatBox label="ページ" value={pagesRead} suffix={`/ ${book.totalPages}`} />}
              {book.weekCount > 0 && <StatBox label="Week" value={getCurrentWeek()} suffix={`/ ${book.weekCount}`} />}
            </div>

            {/* Progress bar */}
            <div style={{ height: 5, background: "#252a38", borderRadius: 3, overflow: "hidden" }}>
              <div
                style={{
                  width: `${totalPct}%`,
                  height: "100%",
                  background: totalPct === 100 ? "#4ead4e" : "linear-gradient(90deg, #255090, #4a90d9)",
                  borderRadius: 3,
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            {/* Start date */}
            {book.weekCount > 0 && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#a0a8b8" }}>開始日</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    background: "#1c2030",
                    border: "1px solid #303648",
                    color: "#a0a8b8",
                    fontSize: 13,
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontFamily: "IBM Plex Mono",
                    outline: "none",
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* === TABS === */}
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #252a38" }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  borderBottom: activeTab === tab.key ? "2px solid #4a90d9" : "2px solid transparent",
                  color: activeTab === tab.key ? "#e2e6ed" : "#8a90a8",
                  fontSize: 15,
                  fontWeight: activeTab === tab.key ? 500 : 400,
                  padding: "14px 24px",
                  fontFamily: "'Noto Sans JP'",
                  transition: "all 0.15s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* === CHAPTERS TAB === */}
          {activeTab === "chapters" && (
            <div style={{ padding: "14px 0 40px" }}>
              {book.chapters.map((ch) => {
                const prog = getChapterProgress(ch);
                const isExp = expandedChapter === ch.id;
                const currentWeek = getCurrentWeek();
                const isNow = hasWeekPlan && book.weekPlan.find((w) => w.week === currentWeek)?.chapters.includes(ch.id);
                const pageCount = ch.endPage - ch.startPage + 1;

                return (
                  <div
                    key={ch.id}
                    style={{
                      marginBottom: 8,
                      border: `1px solid ${isNow ? "#253858" : "#252a38"}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: isNow ? "#182030" : "#181c28",
                    }}
                  >
                    <div
                      onClick={() => setExpandedChapter(isExp ? null : ch.id)}
                      style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div style={{ fontSize: 14, fontFamily: "IBM Plex Mono", color: "#7a8098", minWidth: 26, textAlign: "right" }}>
                        {ch.id}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 16,
                              fontWeight: 500,
                              color: "#c8cdd6",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {ch.title}
                          </span>
                          {isNow && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "#253858",
                                color: "#4a90d9",
                                padding: "2px 7px",
                                borderRadius: 3,
                                fontFamily: "IBM Plex Mono",
                                flexShrink: 0,
                              }}
                            >
                              NOW
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, fontFamily: "IBM Plex Mono" }}>
                          {ch.importance != null && (
                            <span style={{ color: ch.importance >= 4 ? "#c4880a" : "#7a8098" }}>{stars(ch.importance)}</span>
                          )}
                          {ch.gap && (
                            <span style={{ color: ch.gap === "大" ? "#b03030" : ch.gap === "中" ? "#c4880a" : "#2a8040" }}>
                              Gap:{ch.gap}
                            </span>
                          )}
                          {pageCount > 1 && <span style={{ color: "#7a8098" }}>{pageCount}p</span>}
                          {ch.week > 0 && <span style={{ color: "#7a8098" }}>W{ch.week}</span>}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 48 }}>
                        <div
                          style={{
                            fontSize: 17,
                            fontFamily: "IBM Plex Mono",
                            fontWeight: 500,
                            color: prog.pct === 100 ? "#4ead4e" : prog.pct > 0 ? "#4a90d9" : "#404858",
                          }}
                        >
                          {prog.pct}%
                        </div>
                      </div>
                      <span
                        style={{
                          color: "#6a7088",
                          fontSize: 12,
                          transform: isExp ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      >
                        ▶
                      </span>
                    </div>

                    {isExp && (
                      <div style={{ borderTop: "1px solid #252a38", padding: "8px 16px 16px" }}>
                        {ch.sections.map((sec) => {
                          const st = sectionStatus[sec.id] || "unread";
                          const sc = STATUS_COLORS[st];
                          const pages = sec.endPage - sec.startPage + 1;
                          return (
                            <div
                              key={sec.id}
                              onClick={() => cycleStatus(sec.id)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 12px",
                                margin: "4px 0",
                                borderRadius: 6,
                                background: sc.bg,
                                border: `1px solid ${sc.border}`,
                                cursor: "pointer",
                                transition: "all 0.1s",
                              }}
                            >
                              <span style={{ fontSize: 15, color: sc.text, minWidth: 16 }}>{sc.icon}</span>
                              <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono", color: "#7a8098", minWidth: 36 }}>
                                §{sec.id}
                              </span>
                              <span style={{ flex: 1, fontSize: 15, color: st === "unread" ? "#8a92a8" : "#bcc3d0" }}>
                                {sec.title}
                              </span>
                              {sec.startPage > 0 && (
                                <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098" }}>
                                  p.{sec.startPage}–{sec.endPage}
                                </span>
                              )}
                              {pages > 1 && (
                                <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098", minWidth: 24, textAlign: "right" }}>
                                  {pages}p
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Exam topics */}
                        {ch.examTopics && ch.examTopics.length > 0 && (
                          <div style={{ marginTop: 12, padding: "10px 12px", background: "#1a2030", borderRadius: 6, border: "1px solid #2a3040" }}>
                            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#4a7ab0", letterSpacing: 1, marginBottom: 6 }}>
                              {book.examInfo ? "出題テーマ" : "重要トピック"}
                            </div>
                            {ch.examTopics.map((t, i) => (
                              <div key={i} style={{ fontSize: 14, color: "#a0a8b8", padding: "2px 0" }}>
                                → {t}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Tips */}
                        {ch.notes && (
                          <div style={{ marginTop: 8, padding: "10px 12px", background: "#181c28", borderRadius: 6, border: "1px solid #252a38" }}>
                            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098", marginBottom: 4 }}>TIPS</div>
                            <div style={{ fontSize: 14, color: "#a0a8b8" }}>{ch.notes}</div>
                          </div>
                        )}

                        {/* Notes */}
                        <textarea
                          placeholder="メモ..."
                          value={chapterNotes[ch.id] || ""}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setChapterNotes((prev) => ({ ...prev, [ch.id]: e.target.value }))}
                          style={{
                            width: "100%",
                            marginTop: 8,
                            background: "#181c28",
                            border: "1px solid #2a2f3e",
                            borderRadius: 6,
                            color: "#bcc3d0",
                            fontSize: 14,
                            padding: "9px 12px",
                            fontFamily: "'Noto Sans JP'",
                            minHeight: 48,
                            resize: "vertical",
                            boxSizing: "border-box",
                            outline: "none",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Appendices */}
              {book.appendices && book.appendices.length > 0 && (
                <>
                  <div style={{ marginTop: 20, fontSize: 12, fontFamily: "IBM Plex Mono", color: "#7a8098", letterSpacing: 1, marginBottom: 8 }}>
                    APPENDICES
                  </div>
                  {book.appendices.map((ap) => (
                    <div
                      key={ap.id}
                      style={{
                        padding: "10px 16px",
                        marginBottom: 6,
                        borderRadius: 6,
                        background: "#181c28",
                        border: "1px solid #252a38",
                        fontSize: 15,
                        color: "#a0a8b8",
                      }}
                    >
                      {ap.title}
                      <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098", marginLeft: 10 }}>
                        p.{ap.startPage}–{ap.endPage}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* === WEEKLY TAB === */}
          {activeTab === "weekly" && hasWeekPlan && (
            <div style={{ padding: "14px 0 40px" }}>
              {book.weekPlan.map((week) => {
                const cur = getCurrentWeek();
                const isCur = week.week === cur;
                const isPast = week.week < cur;
                const wChapters = book.chapters.filter((c) => week.chapters.includes(c.id));
                const wSections = wChapters.flatMap((c) => c.sections);
                const wDone = wSections.filter((s) => {
                  const st = sectionStatus[s.id] || "unread";
                  return st === "done" || st === "reviewed";
                });
                const wPct = wSections.length ? Math.round((wDone.length / wSections.length) * 100) : 0;

                return (
                  <div
                    key={week.week}
                    style={{
                      padding: "14px 16px",
                      marginBottom: 8,
                      borderRadius: 8,
                      border: `1px solid ${isCur ? "#253858" : "#252a38"}`,
                      background: isCur ? "#182030" : "#181c28",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                      <span
                        style={{
                          fontSize: 13,
                          fontFamily: "IBM Plex Mono",
                          fontWeight: 500,
                          color: isCur ? "#4a90d9" : isPast ? "#2a8040" : "#7a8098",
                          minWidth: 56,
                        }}
                      >
                        Week {String(week.week).padStart(2, "0")}
                      </span>
                      <span style={{ flex: 1, fontSize: 15, color: "#c8cdd6", fontWeight: 500 }}>{week.focus}</span>
                      {isCur && (
                        <span style={{ fontSize: 10, background: "#253858", color: "#4a90d9", padding: "2px 8px", borderRadius: 3, fontFamily: "IBM Plex Mono" }}>
                          NOW
                        </span>
                      )}
                      <span style={{ fontSize: 14, fontFamily: "IBM Plex Mono", color: wPct === 100 ? "#4ead4e" : "#7a8098" }}>
                        {wPct}%
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#252a38", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ width: `${wPct}%`, height: "100%", background: wPct === 100 ? "#2a8040" : "#255090", transition: "width 0.3s" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      {wChapters.map((c) => (
                        <span
                          key={c.id}
                          style={{
                            fontSize: 12,
                            padding: "3px 9px",
                            borderRadius: 4,
                            background: "#1c2030",
                            color: "#a0a8b8",
                            border: "1px solid #2a2f3e",
                          }}
                        >
                          {c.id}章 {c.title}
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 13, color: "#7a8098", fontFamily: "IBM Plex Mono" }}>
                      {week.pages} · {week.pace}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* === EXAMS TAB === */}
          {activeTab === "exams" && hasExamInfo && (
            <div style={{ padding: "14px 0 40px" }}>
              {book.examInfo.description && (
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#1a2030",
                    borderRadius: 8,
                    border: "1px solid #2a3040",
                    marginBottom: 16,
                    fontSize: 14,
                    color: "#a0a8b8",
                    lineHeight: 1.6,
                  }}
                >
                  {book.examInfo.description}
                </div>
              )}

              {book.examInfo.frequentTopics && book.examInfo.frequentTopics.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098", letterSpacing: 1, marginBottom: 8 }}>
                    頻出テーマ × 章
                  </div>
                  {book.examInfo.frequentTopics.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        marginBottom: 4,
                        borderRadius: 6,
                        background: "#181c28",
                        border: "1px solid #252a38",
                      }}
                    >
                      <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono", color: item.freq >= 4 ? "#c4880a" : "#a0a8b8", minWidth: 66 }}>
                        {stars(item.freq)}
                      </span>
                      <span style={{ flex: 1, fontSize: 15, color: "#bcc3d0" }}>{item.theme}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {item.ch.map((c) => (
                          <span
                            key={c}
                            style={{
                              fontSize: 11,
                              padding: "2px 7px",
                              borderRadius: 3,
                              background: "#1a2030",
                              color: "#4a90d9",
                              border: "1px solid #2a3040",
                              fontFamily: "IBM Plex Mono",
                            }}
                          >
                            {c}章
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {book.examInfo.relatedExams && book.examInfo.relatedExams.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#7a8098", letterSpacing: 1, margin: "20px 0 8px" }}>
                    関連試験との対応
                  </div>
                  {book.examInfo.relatedExams.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        marginBottom: 4,
                        borderRadius: 6,
                        background: "#181c28",
                        border: "1px solid #252a38",
                      }}
                    >
                      <span style={{ fontSize: 15, color: "#bcc3d0", minWidth: 130 }}>{item.subject}</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "IBM Plex Mono",
                          color: item.match >= 4 ? "#4ead4e" : item.match >= 2 ? "#c4880a" : "#7a8098",
                          minWidth: 66,
                        }}
                      >
                        {stars(item.match)}
                      </span>
                      <span style={{ fontSize: 13, color: "#a0a8b8", fontFamily: "IBM Plex Mono" }}>{item.coverage}</span>
                      <span style={{ flex: 1 }} />
                      <span style={{ fontSize: 13, color: "#a0a8b8" }}>{item.note}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          <div style={{ padding: "12px 0 36px", fontSize: 13, textAlign: "center", fontFamily: "IBM Plex Mono", display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
            <span style={{ color: STATUS_COLORS.unread.text }}>{STATUS_COLORS.unread.icon}{STATUS_LABELS.unread}</span>
            <span style={{ color: "#6a7088" }}>→</span>
            <span style={{ color: STATUS_COLORS.reading.text }}>{STATUS_COLORS.reading.icon}{STATUS_LABELS.reading}</span>
            <span style={{ color: "#6a7088" }}>→</span>
            <span style={{ color: STATUS_COLORS.done.text }}>{STATUS_COLORS.done.icon}{STATUS_LABELS.done}</span>
            <span style={{ color: "#6a7088" }}>→</span>
            <span style={{ color: STATUS_COLORS.reviewed.text }}>{STATUS_COLORS.reviewed.icon}{STATUS_LABELS.reviewed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, suffix, color }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, color: "#a0a8b8", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontSize: 28, fontFamily: "IBM Plex Mono", fontWeight: 500, color: color || "#bcc3d0" }}>{value}</span>
        <span style={{ fontSize: 14, color: "#a0a8b8" }}>{suffix}</span>
      </div>
    </div>
  );
}
