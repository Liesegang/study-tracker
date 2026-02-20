export interface Section {
	id: string;
	title: string;
	startPage: number;
	endPage: number;
}

export interface Chapter {
	id: number;
	title: string;
	startPage: number;
	endPage: number;
	week?: number;
	importance?: number;
	gap?: string;
	sections: Section[];
	examTopics?: string[];
	notes?: string;
}

export interface Appendix {
	id: string;
	title: string;
	startPage: number;
	endPage: number;
}

export interface WeekPlan {
	week: number;
	chapters: number[];
	pages: string;
	focus: string;
	pace: string;
}

export interface FrequentTopic {
	theme: string;
	ch: number[];
	freq: number;
}

export interface RelatedExam {
	subject: string;
	match: number;
	coverage: string;
	note: string;
}

export interface ExamInfo {
	description: string;
	frequentTopics: FrequentTopic[];
	relatedExams: RelatedExam[];
}

export interface Book {
	id: string;
	category: string;
	title: string;
	author: string;
	edition: string;
	subtitle: string;
	totalPages: number;
	weekCount: number;
	defaultStartDate: string;
	chapters: Chapter[];
	appendices?: Appendix[];
	weekPlan?: WeekPlan[];
	examInfo?: ExamInfo;
}
