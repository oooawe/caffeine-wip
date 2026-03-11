import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit,
  FileText,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateSection,
  useDeletePage,
  useDeleteSection,
  useIsAdmin,
  usePages,
  useSections,
  useUpdateSection,
} from "../hooks/useQueries";
import type { Page, Section } from "../types";
import { storeSessionParameter } from "../utils/urlParams";

export default function AdminPage() {
  const { login, clear, isLoggingIn, identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: sections = [], isLoading: sectionsLoading } = useSections();
  const { data: pages = [], isLoading: pagesLoading } = usePages();
  const navigate = useNavigate();

  const [adminToken, setAdminToken] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [showNewSection, setShowNewSection] = useState(false);

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const deletePage = useDeletePage();

  const isLoading = sectionsLoading || pagesLoading || adminLoading;

  const handleLogin = () => {
    if (adminToken.trim()) {
      storeSessionParameter("caffeineAdminToken", adminToken.trim());
    }
    login();
  };

  const handleLogout = () => {
    clear();
    storeSessionParameter("caffeineAdminToken", "");
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await createSection.mutateAsync(newSectionTitle.trim());
      setNewSectionTitle("");
      setShowNewSection(false);
      toast.success("Section created");
    } catch {
      toast.error("Failed to create section");
    }
  };

  const handleUpdateSection = async (id: bigint) => {
    if (!editingSectionTitle.trim()) return;
    try {
      await updateSection.mutateAsync({
        id,
        title: editingSectionTitle.trim(),
      });
      setEditingSectionId(null);
      toast.success("Section updated");
    } catch {
      toast.error("Failed to update section");
    }
  };

  const handleDeleteSection = async (id: bigint) => {
    try {
      await deleteSection.mutateAsync(id);
      toast.success("Section deleted");
    } catch {
      toast.error("Failed to delete section");
    }
  };

  const handleDeletePage = async (id: bigint) => {
    try {
      await deletePage.mutateAsync(id);
      toast.success("Page deleted");
    } catch {
      toast.error("Failed to delete page");
    }
  };

  const getPagesBySection = (sectionId: bigint): Page[] =>
    pages
      .filter((p) => p.sectionId === sectionId)
      .sort((a, b) => Number(a.order - b.order));

  const sortedSections: Section[] = [...sections].sort((a, b) =>
    Number(a.order - b.order),
  );

  // Not authenticated
  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
        <div className="w-full max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-center mb-2">
            Admin Panel
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-8">
            Sign in to manage your documentation content.
          </p>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="admin-token"
                className="text-sm font-medium text-foreground"
              >
                Admin Token
              </label>
              <Input
                id="admin-token"
                data-ocid="admin.token_input"
                type="password"
                placeholder="Enter admin token..."
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              <p className="text-xs text-muted-foreground">
                Optional: required if admin token is set
              </p>
            </div>

            <Button
              data-ocid="admin.login_button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full"
            >
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              {isLoggingIn ? "Signing in..." : "Sign in with Internet Identity"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated but not admin
  if (!adminLoading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-16">
        <h2 className="font-display text-2xl font-bold mb-3">Access Denied</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          You do not have admin privileges. Make sure you are using the correct
          admin token.
        </p>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Content Manager</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your documentation sections and pages.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-1.5" />
          Sign out
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSections.map((section, sIdx) => {
            const sectionPages = getPagesBySection(section.id);
            const isExpanded = expandedSections.has(section.id.toString());
            const isEditing = editingSectionId === section.id.toString();
            const ocid = sIdx + 1;

            return (
              <div
                key={section.id.toString()}
                data-ocid={`admin.section.item.${ocid}`}
                className="border border-border rounded-lg overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-3 bg-secondary/50">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id.toString())}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    {isEditing ? (
                      <Input
                        value={editingSectionTitle}
                        onChange={(e) => setEditingSectionTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleUpdateSection(section.id);
                          if (e.key === "Escape") setEditingSectionId(null);
                        }}
                        className="h-7 text-sm py-0"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="font-semibold text-sm truncate">
                        {section.title}
                      </span>
                    )}
                  </button>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-primary"
                          onClick={() => handleUpdateSection(section.id)}
                          disabled={updateSection.isPending}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground"
                          onClick={() => setEditingSectionId(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          data-ocid={`admin.section.edit_button.${ocid}`}
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingSectionId(section.id.toString());
                            setEditingSectionTitle(section.title);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              data-ocid={`admin.section.delete_button.${ocid}`}
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Section
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;
                                {section.title}&quot; and all its pages. This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-ocid="admin.section.cancel_button">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                data-ocid="admin.section.confirm_button"
                                onClick={() => handleDeleteSection(section.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="divide-y divide-border">
                    {sectionPages.length === 0 ? (
                      <p className="px-6 py-3 text-sm text-muted-foreground italic">
                        No pages in this section.
                      </p>
                    ) : (
                      sectionPages.map((page, pIdx) => {
                        const pageOcid = pIdx + 1;
                        return (
                          <div
                            key={page.id.toString()}
                            data-ocid={`admin.page.item.${pageOcid}`}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {page.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                /{page.slug}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                data-ocid={`admin.page.edit_button.${pageOcid}`}
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  navigate({
                                    to: "/admin/edit/$pageId",
                                    params: { pageId: page.id.toString() },
                                  })
                                }
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    data-ocid={`admin.page.delete_button.${pageOcid}`}
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Page
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will permanently delete &quot;
                                      {page.title}&quot;. This action cannot be
                                      undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeletePage(page.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        );
                      })
                    )}

                    <div className="px-4 py-2">
                      <Button
                        data-ocid={`admin.add_page_button.${sIdx + 1}`}
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10 h-8"
                        onClick={() =>
                          navigate({
                            to: "/admin/new",
                            search: { sectionId: section.id.toString() },
                          })
                        }
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add page
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {showNewSection ? (
            <div className="flex items-center gap-2 px-4 py-3 border border-primary/30 rounded-lg bg-primary/5">
              <Input
                autoFocus
                placeholder="Section title..."
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateSection();
                  if (e.key === "Escape") setShowNewSection(false);
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleCreateSection}
                disabled={createSection.isPending || !newSectionTitle.trim()}
              >
                {createSection.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowNewSection(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button
              data-ocid="admin.add_section_button"
              variant="outline"
              onClick={() => setShowNewSection(true)}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          )}
        </div>
      )}

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
    </div>
  );
}
