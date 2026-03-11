import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Page, Section } from "../types";
import { useActor } from "./useActor";

export function useSections() {
  const { actor, isFetching } = useActor();
  return useQuery<Section[]>({
    queryKey: ["sections"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getSections();
      return result as Section[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePages() {
  const { actor, isFetching } = useActor();
  return useQuery<Page[]>({
    queryKey: ["pages"],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getPages();
      return result as Page[];
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePageBySlug(slug: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Page | null>({
    queryKey: ["page", slug],
    queryFn: async () => {
      if (!actor) return null;
      const result = await actor.getPageBySlug(slug);
      return (result as Page[])[0] ?? null;
    },
    enabled: !!actor && !isFetching && !!slug,
  });
}

export function usePageById(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Page | null>({
    queryKey: ["page-by-id", id?.toString()],
    queryFn: async () => {
      if (!actor || id == null) return null;
      const result = await actor.getPage(id);
      return (result as Page[])[0] ?? null;
    },
    enabled: !!actor && !isFetching && id != null,
  });
}

export function useSearchPages(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Page[]>({
    queryKey: ["search", query],
    queryFn: async () => {
      if (!actor || !query.trim()) return [];
      const result = await actor.searchPages(query);
      return result as Page[];
    },
    enabled: !!actor && !isFetching && query.trim().length > 0,
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateSection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => {
      if (!actor) throw new Error("No actor");
      return actor.createSection(title);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

export function useUpdateSection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, title }: { id: bigint; title: string }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateSection(id, title);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sections"] }),
  });
}

export function useDeleteSection() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteSection(id);
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["sections"] }),
        qc.invalidateQueries({ queryKey: ["pages"] }),
      ]),
  });
}

export function useCreatePage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      sectionId,
      title,
      slug,
      content,
    }: {
      sectionId: bigint;
      title: string;
      slug: string;
      content: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.createPage(sectionId, title, slug, content);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pages"] }),
  });
}

export function useUpdatePage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      title,
      slug,
      content,
    }: {
      id: bigint;
      title: string;
      slug: string;
      content: string;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.updatePage(id, title, slug, content);
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["pages"] }),
        qc.invalidateQueries({ queryKey: ["page"] }),
        qc.invalidateQueries({ queryKey: ["page-by-id"] }),
      ]),
  });
}

export function useDeletePage() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deletePage(id);
    },
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["pages"] }),
        qc.invalidateQueries({ queryKey: ["page"] }),
        qc.invalidateQueries({ queryKey: ["page-by-id"] }),
      ]),
  });
}
