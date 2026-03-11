import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { AlertCircle, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useMemo } from "react";
import MarkdownContent from "../components/MarkdownContent";
import {
  useIsAdmin,
  usePageBySlug,
  usePages,
  useSections,
} from "../hooks/useQueries";
import type { Page } from "../types";

export default function DocsPage() {
  const { slug } = useParams({ from: "/docs/$slug" });
  const navigate = useNavigate();
  const { data: page, isLoading, isError } = usePageBySlug(slug ?? "");
  const { data: pages = [] } = usePages();
  const { data: sections = [] } = useSections();
  const { data: isAdmin } = useIsAdmin();

  // Build ordered flat list
  const orderedPages = useMemo<Page[]>(() => {
    const sortedSections = [...sections].sort((a, b) =>
      Number(a.order - b.order),
    );
    const result: Page[] = [];
    for (const section of sortedSections) {
      const sp = pages
        .filter((p) => p.sectionId === section.id)
        .sort((a, b) => Number(a.order - b.order));
      result.push(...sp);
    }
    return result;
  }, [pages, sections]);

  const currentIndex = useMemo(
    () => orderedPages.findIndex((p) => p.slug === slug),
    [orderedPages, slug],
  );

  const prevPage = currentIndex > 0 ? orderedPages[currentIndex - 1] : null;
  const nextPage =
    currentIndex < orderedPages.length - 1
      ? orderedPages[currentIndex + 1]
      : null;

  const currentSection = useMemo(
    () => sections.find((s) => s.id === page?.sectionId),
    [sections, page],
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 animate-fade-in">
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/5 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-8" />
        <Skeleton className="h-32 w-full mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <AlertCircle className="w-12 h-12 text-destructive/50 mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Page not found</h2>
        <p className="text-muted-foreground">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-8 py-12 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        {currentSection && (
          <>
            <span>{currentSection.title}</span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-medium">{page.title}</span>
      </div>

      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
            {page.title}
          </h1>
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0 mt-1"
              onClick={() =>
                navigate({
                  to: "/admin/edit/$pageId",
                  params: { pageId: page.id.toString() },
                })
              }
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Last updated{" "}
          {new Date(Number(page.updatedAt) / 1_000_000).toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "long",
              day: "numeric",
            },
          )}
        </div>
        <div className="mt-6 border-b border-border" />
      </header>

      {/* Content */}
      <MarkdownContent content={page.content} />

      {/* Prev / Next Navigation */}
      {(prevPage || nextPage) && (
        <footer className="mt-16 pt-8 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            {prevPage ? (
              <Link
                to="/docs/$slug"
                params={{ slug: prevPage.slug }}
                className="group flex flex-col gap-1 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all"
              >
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" /> Previous
                </span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {prevPage.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
            {nextPage ? (
              <Link
                to="/docs/$slug"
                params={{ slug: nextPage.slug }}
                className="group flex flex-col gap-1 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent transition-all text-right"
              >
                <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                  Next <ChevronRight className="w-3 h-3" />
                </span>
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {nextPage.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </footer>
      )}

      {/* Footer branding */}
      <div className="mt-16 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </div>
    </article>
  );
}
