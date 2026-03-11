import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Code, Eye, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import MarkdownContent from "../components/MarkdownContent";
import {
  useCreatePage,
  usePageById,
  useSections,
  useUpdatePage,
} from "../hooks/useQueries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditorPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const searchStr = routerState.location.searchStr ?? "";

  // Parse pageId from /admin/edit/:pageId
  const editMatch = pathname.match(/^\/admin\/edit\/(.+)$/);
  const pageId = editMatch ? editMatch[1] : undefined;
  const isNew = !pageId;

  // Parse sectionId from search params for /admin/new
  const searchParams = new URLSearchParams(searchStr);
  const preselectedSectionId = searchParams.get("sectionId") ?? undefined;

  const pageIdBig = pageId ? BigInt(pageId) : null;

  const { data: page, isLoading: pageLoading } = usePageById(pageIdBig);
  const { data: sections = [], isLoading: sectionsLoading } = useSections();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [sectionId, setSectionId] = useState<string>(
    preselectedSectionId ?? "",
  );
  const [content, setContent] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const createPage = useCreatePage();
  const updatePage = useUpdatePage();

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setSlug(page.slug);
      setSectionId(page.sectionId.toString());
      setContent(page.content);
    }
  }, [page]);

  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !sectionId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      if (isNew) {
        const created = (await createPage.mutateAsync({
          sectionId: BigInt(sectionId),
          title: title.trim(),
          slug: slug.trim(),
          content,
        })) as { slug: string };
        toast.success("Page created successfully");
        navigate({ to: "/docs/$slug", params: { slug: created.slug } });
      } else if (page) {
        await updatePage.mutateAsync({
          id: page.id,
          title: title.trim(),
          slug: slug.trim(),
          content,
        });
        toast.success("Page saved successfully");
        navigate({ to: "/docs/$slug", params: { slug: slug.trim() } });
      }
    } catch {
      toast.error("Failed to save page");
    }
  };

  const isSaving = createPage.isPending || updatePage.isPending;
  const isLoading = (!isNew && pageLoading) || sectionsLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const defaultMarkdown = `# ${title || "Page Title"}

Start writing your documentation here. You can use **Markdown** formatting.

## Overview

Describe what this page covers.

## Details

Add more sections as needed.
`;

  return (
    <div className="max-w-4xl mx-auto px-8 py-8 animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin" })}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div className="flex-1" />
        <Button
          data-ocid="docs.cancel_button"
          variant="outline"
          onClick={() => navigate({ to: "/admin" })}
        >
          Cancel
        </Button>
        <Button
          data-ocid="docs.save_button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>

      <h1 className="font-display text-2xl font-bold mb-6">
        {isNew ? "Create New Page" : "Edit Page"}
      </h1>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1.5">
          <Label htmlFor="page-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="page-slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="page-slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            placeholder="page-slug"
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="mb-6 space-y-1.5">
        <Label htmlFor="page-section">
          Section <span className="text-destructive">*</span>
        </Label>
        <Select value={sectionId} onValueChange={setSectionId}>
          <SelectTrigger
            id="page-section"
            data-ocid="docs.editor"
            className="w-64"
          >
            <SelectValue placeholder="Select a section..." />
          </SelectTrigger>
          <SelectContent>
            {sections.map((s) => (
              <SelectItem key={s.id.toString()} value={s.id.toString()}>
                {s.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="edit" className="flex-1">
        <TabsList className="mb-4">
          <TabsTrigger value="edit" className="gap-1.5">
            <Code className="w-3.5 h-3.5" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={defaultMarkdown}
            className="min-h-[500px] font-mono text-sm resize-y leading-relaxed"
          />
        </TabsContent>

        <TabsContent value="preview">
          <div className="min-h-[500px] border border-border rounded-lg p-6 bg-card">
            {content ? (
              <MarkdownContent content={content} />
            ) : (
              <p className="text-muted-foreground italic">
                Nothing to preview yet. Start writing in the Edit tab.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-12 text-center text-xs text-muted-foreground">
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
    </div>
  );
}
