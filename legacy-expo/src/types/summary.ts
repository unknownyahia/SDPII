import type { SummarizableSpotPost } from './post';

export type SummarizeAreaRequest = {
  posts: SummarizableSpotPost[];
};

export type SummarizeAreaResponse = {
  summary: string;
};
