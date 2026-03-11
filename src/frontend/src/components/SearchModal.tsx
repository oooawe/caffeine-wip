import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "@tanstack/react-router";
import { FileText, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useSearchPages } from "../hooks/useQueries";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  const { data: results = [], isFetching } = useSearchPages(debouncedQuery);

  const handleSelect = useCallback(
    (slug: string) => {
      navigate({ to: "/docs/$slug", params: { slug } });
      onOpenChange(false);
      setQuery("");
    },
    [navigate, onOpenChange],
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const getSnippet = (content: string, q: string): string => {
    if (!q) return content.slice(0, 120);
    const idx = content.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return content.slice(0, 120);
    const start = Math.max(0, idx - 40);
    const end = Math.min(content.length, idx + 80);
    return (
      (start > 0 ? "..." : "") +
      content.slice(start, end) +
      (end < content.length ? "..." : "")
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="search.modal"
        className="max-w-xl p-0 overflow-hidden gap-0"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            data-ocid="search.search_input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="border-0 shadow-none focus-visible:ring-0 text-base p-0 h-auto bg-transparent"
          />
          {isFetching && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <ScrollArea className="max-h-96">
          {query.trim() === "" ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search...
            </div>
          ) : results.length === 0 && !isFetching ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {results.map((page, index) => (
                <button
                  type="button"
                  key={page.id.toString()}
                  data-ocid={`search.result.item.${index + 1}`}
                  onClick={() => handleSelect(page.slug)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent text-left transition-colors"
                >
                  <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {page.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {getSnippet(page.content, debouncedQuery)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
