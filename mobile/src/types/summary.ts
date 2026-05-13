import type { SpotCategory } from './post';

export type SummarizableAreaItem = {
  kind?: 'post' | 'event';
  title?: string | null;
  text: string;
  category?: SpotCategory | null;
};

export type SummarizeAreaRequest = {
  posts: SummarizableAreaItem[];
};

export type SummarizeAreaResponse = {
  summary: string;
};
