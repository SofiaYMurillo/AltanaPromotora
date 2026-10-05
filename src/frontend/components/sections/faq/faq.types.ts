export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqBlock = {
  id: string;
  items: FaqItem[];
};

export type FaqData = {
  title: string;
  description: string;
  blocks: FaqBlock[];
};
