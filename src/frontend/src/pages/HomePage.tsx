import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { useEffect } from "react";
import { usePages, useSections } from "../hooks/useQueries";

export default function HomePage() {
  const navigate = useNavigate();
  const { data: pages, isLoading: pagesLoading } = usePages();
  const { data: sections, isLoading: sectionsLoading } = useSections();

  const isLoading = pagesLoading || sectionsLoading;

  useEffect(() => {
    if (isLoading) return;
    if (!pages || !sections) return;

    const sortedSections = [...sections].sort((a, b) =>
      Number(a.order - b.order),
    );
    for (const section of sortedSections) {
      const sectionPages = pages
        .filter((p) => p.sectionId === section.id)
        .sort((a, b) => Number(a.order - b.order));
      if (sectionPages.length > 0) {
        navigate({
          to: "/docs/$slug",
          params: { slug: sectionPages[0].slug },
          replace: true,
        });
        return;
      }
    }
  }, [pages, sections, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="space-y-4 w-full max-w-2xl px-8">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <BookOpen className="w-8 h-8 text-primary" />
      </div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-3">
        Welcome to DocuBase
      </h1>
      <p className="text-muted-foreground max-w-sm">
        Your knowledge base is empty. Go to the{" "}
        <a href="/admin" className="text-primary hover:underline">
          Admin panel
        </a>{" "}
        to create your first section and page.
      </p>
    </div>
  );
}
