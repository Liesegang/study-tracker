import { useCallback, useEffect, useMemo, useState } from "react";
import books from "./books/index.ts";
import type { Book, Chapter, Section } from "./types.ts";

type StatusKey = "unread" | "reading" | "done" | "reviewed";

interface StatusStyle {
	bg: string;
	border: string;
	text: string;
	icon: string;
	label: string;
}

const STATUS: Record<StatusKey, StatusStyle> = {
	unread: { bg: "bg-surface-1", border: "border-border", text: "text-text-dim", icon: "○", label: "未読" },
	reading: {
		bg: "bg-[#1a2818]",
		border: "border-[#2a4828]",
		text: "text-status-green",
		icon: "◎",
		label: "読書中",
	},
	done: { bg: "bg-[#182030]", border: "border-[#284060]", text: "text-status-blue", icon: "●", label: "読了" },
	reviewed: {
		bg: "bg-[#241a30]",
		border: "border-[#402868]",
		text: "text-status-purple",
		icon: "◆",
		label: "復習済",
	},
};

const STATUS_ORDER: StatusKey[] = ["unread", "reading", "done", "reviewed"];

function storageKey(bookId: string, key: string): string {
	return `st-${bookId}-${key}`;
}

function loadJSON<T>(key: string, fallback: T): T {
	try {
		const v = localStorage.getItem(key);
		return v ? JSON.parse(v) : fallback;
	} catch {
		return fallback;
	}
}

function saveJSON(key: string, value: unknown): void {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}

function Stars({ n }: { n: number }) {
	return (
		<span className="font-mono">
			{"█".repeat(n)}
			{"░".repeat(5 - n)}
		</span>
	);
}

/* ── Sidebar ── */
interface SidebarProps {
	books: Book[];
	currentId: string;
	onSelect: (id: string) => void;
	open: boolean;
	onClose: () => void;
}

function Sidebar({ books, currentId, onSelect, open, onClose }: SidebarProps) {
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
				b.author?.toLowerCase().includes(q) ||
				b.subtitle?.toLowerCase().includes(q),
		);
	}, [books, search]);

	const booksByCategory = categories.map((cat) => ({
		category: cat,
		items: books.filter((b) => b.category === cat),
	}));
	const uncategorized = books.filter((b) => !b.category);

	const handleSelect = (id: string) => {
		onSelect(id);
		setSearch("");
		onClose();
	};

	const renderBookItem = (b: Book) => {
		const active = b.id === currentId;
		return (
			<button
				key={b.id}
				type="button"
				onClick={() => handleSelect(b.id)}
				className={`block w-full text-left text-[13px] leading-snug px-3 py-2.5 border-l-[3px] transition-all cursor-pointer ${
					active
						? "bg-surface-3 border-l-accent text-text-primary"
						: "bg-transparent border-l-transparent text-text-muted hover:bg-surface-2 hover:text-text-secondary"
				}`}
			>
				<div>{b.title}</div>
				{b.author && <div className="text-[11px] text-text-faint mt-0.5">{b.author}</div>}
			</button>
		);
	};

	if (books.length <= 1) return null;

	return (
		<>
			{open && (
				<div
					onClick={onClose}
					onKeyDown={() => {}}
					className="sidebar-overlay fixed inset-0 bg-black/50 z-[99] hidden"
				/>
			)}
			<aside
				className={`sidebar w-60 min-w-60 bg-surface-1 border-r border-border h-screen sticky top-0 overflow-y-auto flex flex-col ${open ? "sidebar-open" : ""}`}
			>
				<div className="px-3.5 pt-4 pb-3 border-b border-border">
					<div className="text-sm font-semibold text-text-primary font-mono">Study Tracker</div>
				</div>

				<div className="p-3">
					<input
						type="text"
						placeholder="検索..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-surface-2 border border-border-light text-text-secondary text-[13px] px-2.5 py-1.5 rounded-md font-sans outline-none focus:border-accent-dim transition-colors"
					/>
				</div>

				<div className="flex-1 overflow-y-auto">
					{filtered ? (
						<div>
							{filtered.length === 0 && <div className="text-xs text-text-dim px-3.5 py-2.5">該当なし</div>}
							{filtered.map(renderBookItem)}
						</div>
					) : (
						<div>
							{booksByCategory.map(({ category, items }) => (
								<div key={category}>
									<div className="text-[10px] font-mono text-text-dim tracking-wider px-3.5 pt-3 pb-1 uppercase">
										{category}
									</div>
									{items.map(renderBookItem)}
								</div>
							))}
							{uncategorized.length > 0 && (
								<div>
									<div className="text-[10px] font-mono text-text-dim tracking-wider px-3.5 pt-3 pb-1">OTHER</div>
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
	const [currentBookId, setCurrentBookId] = useState<string>(() => loadJSON("st-current-book", null) || books[0].id);
	const book = books.find((b) => b.id === currentBookId) || books[0];
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const [sectionStatus, setSectionStatus] = useState<Record<string, StatusKey>>(() =>
		loadJSON(storageKey(book.id, "status"), {}),
	);
	const [chapterNotes, setChapterNotes] = useState<Record<string, string>>(() =>
		loadJSON(storageKey(book.id, "notes"), {}),
	);
	const [activeTab, setActiveTab] = useState<string>("chapters");
	const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
	const [startDate, setStartDate] = useState<string>(
		() => loadJSON(storageKey(book.id, "date"), null) || book.defaultStartDate,
	);

	const selectBook = useCallback((id: string) => {
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

	useEffect(() => {
		saveJSON(storageKey(book.id, "status"), sectionStatus);
	}, [sectionStatus, book.id]);
	useEffect(() => {
		saveJSON(storageKey(book.id, "notes"), chapterNotes);
	}, [chapterNotes, book.id]);
	useEffect(() => {
		saveJSON(storageKey(book.id, "date"), startDate);
	}, [startDate, book.id]);

	const cycleStatus = useCallback((sectionId: string) => {
		setSectionStatus((prev) => {
			const current: StatusKey = prev[sectionId] || "unread";
			const next = STATUS_ORDER[(STATUS_ORDER.indexOf(current) + 1) % STATUS_ORDER.length];
			return { ...prev, [sectionId]: next };
		});
	}, []);

	const getChapterProgress = useCallback(
		(chapter: Chapter) => {
			const total = chapter.sections.length;
			const done = chapter.sections.filter((s: Section) => {
				const st: StatusKey = sectionStatus[s.id] || "unread";
				return st === "done" || st === "reviewed";
			}).length;
			return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
		},
		[sectionStatus],
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
		const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
		return Math.max(1, Math.min(diff + 1, book.weekCount));
	};

	const hasWeekPlan = book.weekPlan && book.weekPlan.length > 0;
	const hasExamInfo =
		book.examInfo &&
		((book.examInfo?.frequentTopics && book.examInfo?.frequentTopics.length > 0) ||
			(book.examInfo?.relatedExams && book.examInfo?.relatedExams.length > 0));

	const tabs = [{ key: "chapters", label: "章別" }];
	if (hasWeekPlan) tabs.push({ key: "weekly", label: "週間" });
	if (hasExamInfo) tabs.push({ key: "exams", label: "過去問" });

	return (
		<div className="flex bg-surface-0 text-text-secondary min-h-screen font-sans">
			{books.length > 1 && (
				<Sidebar
					books={books}
					currentId={currentBookId}
					onSelect={selectBook}
					open={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>
			)}

			<div className="flex-1 min-w-0">
				{/* Mobile hamburger */}
				{books.length > 1 && (
					<button
						type="button"
						onClick={() => setSidebarOpen(true)}
						className="mobile-menu-btn hidden fixed top-3 left-3 z-[98] bg-surface-1 border border-border-light text-text-muted text-lg px-2.5 py-1.5 rounded-md cursor-pointer font-mono"
					>
						☰
					</button>
				)}

				{/* === HEADER === */}
				<div className="bg-gradient-to-b from-surface-2 to-surface-0 border-b border-border-light px-5 py-6">
					<div className="max-w-3xl mx-auto">
						{book.subtitle && (
							<div className="text-xs font-mono text-accent tracking-[3px] uppercase mb-2">{book.subtitle}</div>
						)}
						<h1 className="text-2xl font-bold text-text-primary leading-tight mb-1">
							{book.title}
							{(book.author || book.edition) && (
								<span className="font-light text-text-muted text-base ml-2.5">
									{book.author} {book.edition}
								</span>
							)}
						</h1>
						<div className="text-[13px] text-text-muted font-mono mt-2 mb-4">
							{book.chapters.length}章 · {allSections.length}節{book.totalPages > 0 && ` · ${book.totalPages}頁`}
							{book.weekCount > 0 && ` · ${book.weekCount}週間プラン`}
						</div>

						{/* Stats */}
						<div className="flex gap-5 mb-3.5">
							<StatBox
								label="進捗"
								value={totalPct}
								suffix="%"
								color={totalPct === 100 ? "text-status-green" : "text-accent"}
							/>
							<StatBox label="節" value={totalDone} suffix={`/ ${allSections.length}`} />
							{book.totalPages > 0 && <StatBox label="ページ" value={pagesRead} suffix={`/ ${book.totalPages}`} />}
							{book.weekCount > 0 && <StatBox label="Week" value={getCurrentWeek()} suffix={`/ ${book.weekCount}`} />}
						</div>

						{/* Progress bar */}
						<div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
							<div
								className={`h-full rounded-full transition-[width] duration-400 ease-out ${totalPct === 100 ? "bg-status-green" : "bg-gradient-to-r from-accent-dim to-accent"}`}
								style={{ width: `${totalPct}%` }}
							/>
						</div>

						{/* Start date */}
						{book.weekCount > 0 && (
							<div className="mt-3 flex items-center gap-2">
								<span className="text-[13px] text-text-dim">開始日</span>
								<input
									type="date"
									value={startDate}
									onChange={(e) => setStartDate(e.target.value)}
									className="bg-surface-2 border border-border-light text-text-muted text-[13px] px-2 py-0.5 rounded font-mono outline-none"
								/>
							</div>
						)}
					</div>
				</div>

				{/* === TABS + CONTENT === */}
				<div className="max-w-3xl mx-auto px-5">
					<div className="flex border-b border-border">
						{tabs.map((tab) => (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`bg-transparent border-none cursor-pointer text-[15px] px-6 py-3.5 font-sans transition-all border-b-2 ${
									activeTab === tab.key
										? "border-b-accent text-text-primary font-medium"
										: "border-b-transparent text-text-dim hover:text-text-muted"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* === CHAPTERS === */}
					{activeTab === "chapters" && (
						<div className="py-3.5 pb-10">
							{book.chapters.map((ch) => {
								const prog = getChapterProgress(ch);
								const isExp = expandedChapter === ch.id;
								const currentWeek = getCurrentWeek();
								const isNow =
									hasWeekPlan && book.weekPlan?.find((w) => w.week === currentWeek)?.chapters.includes(ch.id);
								const pageCount = ch.endPage - ch.startPage + 1;

								return (
									<div
										key={ch.id}
										className={`mb-2 border rounded-lg overflow-hidden ${
											isNow ? "border-border-accent bg-surface-3" : "border-border bg-surface-1"
										}`}
									>
										<div
											onClick={() => setExpandedChapter(isExp ? null : ch.id)}
											onKeyDown={() => {}}
											className="px-4 py-3.5 cursor-pointer flex items-center gap-3"
										>
											<div className="text-sm font-mono text-text-dim min-w-[26px] text-right">{ch.id}</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="text-base font-medium text-text-secondary truncate">{ch.title}</span>
													{isNow && (
														<span className="text-[10px] bg-border-accent text-accent px-1.5 py-0.5 rounded font-mono shrink-0">
															NOW
														</span>
													)}
												</div>
												<div className="flex gap-3 text-xs font-mono">
													{ch.importance != null && (
														<span className={ch.importance >= 4 ? "text-status-yellow" : "text-text-dim"}>
															<Stars n={ch.importance} />
														</span>
													)}
													{ch.gap && (
														<span
															className={
																ch.gap === "大"
																	? "text-status-red"
																	: ch.gap === "中"
																		? "text-status-yellow"
																		: "text-status-green-dim"
															}
														>
															Gap:{ch.gap}
														</span>
													)}
													{pageCount > 1 && <span className="text-text-dim">{pageCount}p</span>}
													{ch.week != null && ch.week > 0 && <span className="text-text-dim">W{ch.week}</span>}
												</div>
											</div>
											<div className="text-right min-w-[48px]">
												<div
													className={`text-[17px] font-mono font-medium ${
														prog.pct === 100 ? "text-status-green" : prog.pct > 0 ? "text-accent" : "text-text-faint"
													}`}
												>
													{prog.pct}%
												</div>
											</div>
											<span className={`text-text-faint text-xs transition-transform ${isExp ? "rotate-90" : ""}`}>
												▶
											</span>
										</div>

										{isExp && (
											<div className="border-t border-border px-4 py-2 pb-4">
												{ch.sections.map((sec) => {
													const st = sectionStatus[sec.id] || "unread";
													const sc = STATUS[st];
													const pages = sec.endPage - sec.startPage + 1;
													return (
														<div
															key={sec.id}
															onClick={() => cycleStatus(sec.id)}
															onKeyDown={() => {}}
															className={`flex items-center gap-2.5 px-3 py-2 my-1 rounded-md border cursor-pointer transition-all ${sc.bg} ${sc.border}`}
														>
															<span className={`text-[15px] min-w-4 ${sc.text}`}>{sc.icon}</span>
															<span className="text-xs font-mono text-text-dim min-w-[36px]">§{sec.id}</span>
															<span
																className={`flex-1 text-[15px] ${st === "unread" ? "text-text-dim" : "text-text-secondary"}`}
															>
																{sec.title}
															</span>
															{sec.startPage > 0 && (
																<span className="text-[11px] font-mono text-text-dim">
																	p.{sec.startPage}–{sec.endPage}
																</span>
															)}
															{pages > 1 && (
																<span className="text-[11px] font-mono text-text-dim min-w-6 text-right">{pages}p</span>
															)}
														</div>
													);
												})}

												{ch.examTopics && ch.examTopics.length > 0 && (
													<div className="mt-3 p-2.5 bg-surface-2 rounded-md border border-border-light">
														<div className="text-[11px] font-mono text-accent tracking-wider mb-1.5">
															{book.examInfo ? "出題テーマ" : "重要トピック"}
														</div>
														{ch.examTopics.map((t, i) => (
															<div key={`topic-${i}`} className="text-sm text-text-muted py-0.5">
																→ {t}
															</div>
														))}
													</div>
												)}

												{ch.notes && (
													<div className="mt-2 p-2.5 bg-surface-1 rounded-md border border-border">
														<div className="text-[11px] font-mono text-text-dim mb-1">TIPS</div>
														<div className="text-sm text-text-muted">{ch.notes}</div>
													</div>
												)}

												<textarea
													placeholder="メモ..."
													value={chapterNotes[ch.id] || ""}
													onClick={(e) => e.stopPropagation()}
													onChange={(e) =>
														setChapterNotes((prev) => ({
															...prev,
															[ch.id]: e.target.value,
														}))
													}
													className="w-full mt-2 bg-surface-1 border border-border rounded-md text-text-secondary text-sm p-2.5 font-sans min-h-12 resize-y outline-none focus:border-border-light transition-colors"
												/>
											</div>
										)}
									</div>
								);
							})}

							{book.appendices && book.appendices.length > 0 && (
								<>
									<div className="mt-5 text-xs font-mono text-text-dim tracking-wider mb-2">APPENDICES</div>
									{book.appendices.map((ap) => (
										<div
											key={ap.id}
											className="px-4 py-2.5 mb-1.5 rounded-md bg-surface-1 border border-border text-[15px] text-text-muted"
										>
											{ap.title}
											<span className="text-[11px] font-mono text-text-dim ml-2.5">
												p.{ap.startPage}–{ap.endPage}
											</span>
										</div>
									))}
								</>
							)}
						</div>
					)}

					{/* === WEEKLY === */}
					{activeTab === "weekly" && hasWeekPlan && (
						<div className="py-3.5 pb-10">
							{book.weekPlan?.map((week) => {
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
										className={`px-4 py-3.5 mb-2 rounded-lg border ${
											isCur ? "border-border-accent bg-surface-3" : "border-border bg-surface-1"
										}`}
									>
										<div className="flex items-center gap-2.5 mb-2">
											<span
												className={`text-[13px] font-mono font-medium min-w-[56px] ${
													isCur ? "text-accent" : isPast ? "text-status-green-dim" : "text-text-dim"
												}`}
											>
												Week {String(week.week).padStart(2, "0")}
											</span>
											<span className="flex-1 text-[15px] text-text-secondary font-medium">{week.focus}</span>
											{isCur && (
												<span className="text-[10px] bg-border-accent text-accent px-2 py-0.5 rounded font-mono">
													NOW
												</span>
											)}
											<span className={`text-sm font-mono ${wPct === 100 ? "text-status-green" : "text-text-dim"}`}>
												{wPct}%
											</span>
										</div>
										<div className="h-1 bg-surface-3 rounded-sm overflow-hidden mb-2">
											<div
												className={`h-full transition-[width] duration-300 ${wPct === 100 ? "bg-status-green-dim" : "bg-accent-dim"}`}
												style={{ width: `${wPct}%` }}
											/>
										</div>
										<div className="flex gap-2 flex-wrap mb-1.5">
											{wChapters.map((c) => (
												<span
													key={c.id}
													className="text-xs px-2 py-0.5 rounded bg-surface-2 text-text-muted border border-border-light"
												>
													{c.id}章 {c.title}
												</span>
											))}
										</div>
										<div className="text-[13px] text-text-dim font-mono">
											{week.pages} · {week.pace}
										</div>
									</div>
								);
							})}
						</div>
					)}

					{/* === EXAMS === */}
					{activeTab === "exams" && hasExamInfo && (
						<div className="py-3.5 pb-10">
							{book.examInfo?.description && (
								<div className="p-3.5 bg-surface-2 rounded-lg border border-border-light mb-4 text-sm text-text-muted leading-relaxed">
									{book.examInfo?.description}
								</div>
							)}

							{book.examInfo?.frequentTopics && book.examInfo?.frequentTopics.length > 0 && (
								<>
									<div className="text-[11px] font-mono text-text-dim tracking-wider mb-2">頻出テーマ × 章</div>
									{book.examInfo?.frequentTopics.map((item, i) => (
										<div
											key={`freq-${i}`}
											className="flex items-center gap-2.5 px-3.5 py-2.5 mb-1 rounded-md bg-surface-1 border border-border"
										>
											<span
												className={`text-xs font-mono min-w-[66px] ${item.freq >= 4 ? "text-status-yellow" : "text-text-muted"}`}
											>
												<Stars n={item.freq} />
											</span>
											<span className="flex-1 text-[15px] text-text-secondary">{item.theme}</span>
											<div className="flex gap-1">
												{item.ch.map((c) => (
													<span
														key={c}
														className="text-[11px] px-1.5 py-0.5 rounded bg-surface-2 text-accent border border-border-light font-mono"
													>
														{c}章
													</span>
												))}
											</div>
										</div>
									))}
								</>
							)}

							{book.examInfo?.relatedExams && book.examInfo?.relatedExams.length > 0 && (
								<>
									<div className="text-[11px] font-mono text-text-dim tracking-wider mt-5 mb-2">関連試験との対応</div>
									{book.examInfo?.relatedExams.map((item, i) => (
										<div
											key={`exam-${i}`}
											className="flex items-center gap-2.5 px-3.5 py-2.5 mb-1 rounded-md bg-surface-1 border border-border"
										>
											<span className="text-[15px] text-text-secondary min-w-[130px]">{item.subject}</span>
											<span
												className={`text-xs font-mono min-w-[66px] ${
													item.match >= 4
														? "text-status-green"
														: item.match >= 2
															? "text-status-yellow"
															: "text-text-dim"
												}`}
											>
												<Stars n={item.match} />
											</span>
											<span className="text-[13px] text-text-muted font-mono">{item.coverage}</span>
											<span className="flex-1" />
											<span className="text-[13px] text-text-muted">{item.note}</span>
										</div>
									))}
								</>
							)}
						</div>
					)}

					{/* Legend */}
					<div className="py-3 pb-9 text-[13px] text-center font-mono flex justify-center items-center gap-1.5">
						{STATUS_ORDER.map((key, i) => (
							<span key={key}>
								{i > 0 && <span className="text-text-faint mx-1">→</span>}
								<span className={STATUS[key].text}>
									{STATUS[key].icon}
									{STATUS[key].label}
								</span>
							</span>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function StatBox({ label, value, suffix, color }: { label: string; value: number; suffix: string; color?: string }) {
	return (
		<div className="flex-1">
			<div className="text-[13px] text-text-muted mb-1">{label}</div>
			<div className="flex items-baseline gap-1">
				<span className={`text-[28px] font-mono font-medium ${color || "text-text-secondary"}`}>{value}</span>
				<span className="text-sm text-text-muted">{suffix}</span>
			</div>
		</div>
	);
}
