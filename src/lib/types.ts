
export type SolutionSectionType = 'heading' | 'paragraph' | 'code' | 'equation' | 'hint';

export interface SolutionSection {
  id: string; // Unique ID for the section, e.g., for React keys
  type: SolutionSectionType;
  content: string;
  language?: string; // Optional: for 'code' type, specifies the language
}

export interface Solution {
  id: string; // slug-like, generated from title
  title: string; // Blog title (e.g., "Solution for CSES Two Sets")
  problemId: string; // CSES Problem Name or ID (e.g., "Two Sets")
  problemStatementLink?: string; // Optional link to original CSES problem
  sections: SolutionSection[];
  tags: string[];
  category: string;
  author: string; // static "CSES Solver Team" for now
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
  isApproved: boolean; // Whether the solution is approved by an admin
}

export interface SolutionSubmission {
  title: string;
  problemId: string;
  problemStatementLink?: string;
  sections: Array<Omit<SolutionSection, 'id'>>; // IDs will be generated on server, language is included
  tags: string; // Comma-separated string from form
  category: string;
}

