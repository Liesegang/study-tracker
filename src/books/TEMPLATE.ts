// Template for adding a new textbook.
// Copy this file, rename it, and fill in the data.
// Then import it in src/books/index.js.
export default {
	id: "unique-book-id", // URL-safe identifier
	title: "教科書タイトル",
	author: "著者名",
	edition: "",
	subtitle: "目標や用途の説明",
	totalPages: 0,
	weekCount: 0, // 0 if no weekly plan
	defaultStartDate: "2026-01-01",

	chapters: [
		{
			id: 1,
			title: "章タイトル",
			startPage: 1,
			endPage: 10,
			week: 1, // which week in the plan (0 if no plan)
			importance: 3, // 1-5
			gap: "小", // 小/中/大 - how much is new to you
			sections: [
				{ id: "1-1", title: "節タイトル", startPage: 1, endPage: 5 },
				{ id: "1-2", title: "節タイトル", startPage: 6, endPage: 10 },
			],
			examTopics: ["出題テーマ1"],
			notes: "学習メモ",
		},
	],

	appendices: [
		// { id: "A", title: "付録A", startPage: 100, endPage: 110 },
	],

	weekPlan: [
		// { week: 1, chapters: [1], pages: "p.1-10", focus: "基礎", pace: "メモ" },
	],

	examInfo: {
		description: "",
		frequentTopics: [
			// { theme: "テーマ", ch: [1], freq: 3 },
		],
		relatedExams: [
			// { subject: "試験名", coverage: "1-3章", match: 3, note: "メモ" },
		],
	},
};
