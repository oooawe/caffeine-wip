import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Search,
  Settings,
} from "lucide-react";
import { useEffect, useState } from "react";
import { usePages, useSections } from "../hooks/useQueries";
import type { Page, Section } from "../types";

interface SidebarProps {
  onSearchOpen: () => void;
}

export default function Sidebar({ onSearchOpen }: SidebarProps) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: pages = [], isLoading: pagesLoading } = usePages();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const isLoading = sectionsLoading || pagesLoading;

  // Auto-expand section containing active page
  useEffect(() => {
    const slug = pathname.replace("/docs/", "");
    const activePage = pages.find((p) => p.slug === slug);
    if (activePage) {
      setExpandedSections(
        (prev) => new Set([...prev, activePage.sectionId.toString()]),
      );
    }
  }, [pathname, pages]);

  // Initialize all sections as expanded
  useEffect(() => {
    if (sections.length > 0) {
      setExpandedSections(new Set(sections.map((s) => s.id.toString())));
    }
  }, [sections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const getPagesBySection = (sectionId: bigint): Page[] =>
    pages
      .filter((p) => p.sectionId === sectionId)
      .sort((a, b) => Number(a.order - b.order));

  const sortedSections: Section[] = [...sections].sort((a, b) =>
    Number(a.order - b.order),
  );

  const currentSlug = pathname.startsWith("/docs/")
    ? pathname.replace("/docs/", "")
    : null;

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          onSearchOpen();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onSearchOpen]);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-screen bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-sidebar-border">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
          <BookOpen className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-display font-semibold text-base text-sidebar-foreground tracking-tight">
          DocuBase
        </span>
      </div>

      {/* Search */}
      <div className="px-3 py-3">
        <button
          type="button"
          data-ocid="sidebar.search_input"
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-background border border-border rounded-md hover:border-primary/50 hover:text-foreground transition-all"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">Search docs...</span>
          <kbd className="hidden sm:inline-flex items-center text-xs text-muted-foreground border border-border rounded px-1 py-0.5">
            /
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="py-2">
          {isLoading ? (
            <div className="space-y-3 px-3 py-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <Skeleton key={n} className="h-4 w-full" />
              ))}
            </div>
          ) : sortedSections.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No content yet</p>
            </div>
          ) : (
            sortedSections.map((section, sectionIndex) => {
              const sectionPages = getPagesBySection(section.id);
              const isExpanded = expandedSections.has(section.id.toString());
              const ocidIndex = sectionIndex + 1;

              return (
                <div key={section.id.toString()} className="mb-1">
                  <button
                    type="button"
                    data-ocid={`sidebar.section.item.${ocidIndex}`}
                    onClick={() => toggleSection(section.id.toString())}
                    className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground rounded-md hover:bg-sidebar-accent transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{section.title}</span>
                  </button>

                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-3">
                      {sectionPages.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-1 px-2 italic">
                          No pages
                        </p>
                      ) : (
                        sectionPages.map((page, pageIndex) => {
                          const isActive = page.slug === currentSlug;
                          const pageOcid = `sidebar.page.link.${pageIndex + 1}`;
                          return (
                            <Link
                              key={page.id.toString()}
                              to="/docs/$slug"
                              params={{ slug: page.slug }}
                              data-ocid={pageOcid}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors truncate",
                                isActive
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-accent-foreground",
                              )}
                            >
                              <FileText className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                              <span className="truncate">{page.title}</span>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-3">
        <Link
          to="/admin"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Admin</span>
        </Link>
      </div>
    </aside>
  );
}
