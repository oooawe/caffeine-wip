export interface Section {
  id: bigint;
  title: string;
  order: bigint;
  createdAt: bigint;
}

export interface Page {
  id: bigint;
  sectionId: bigint;
  title: string;
  slug: string;
  content: string;
  order: bigint;
  createdAt: bigint;
  updatedAt: bigint;
}
