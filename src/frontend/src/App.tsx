import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useState } from "react";
import SearchModal from "./components/SearchModal";
import Sidebar from "./components/Sidebar";
import AdminPage from "./pages/AdminPage";
import DocsPage from "./pages/DocsPage";
import EditorPage from "./pages/EditorPage";
import HomePage from "./pages/HomePage";

function RootLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  component: DocsPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const adminEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/edit/$pageId",
  component: EditorPage,
});

const adminNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/new",
  validateSearch: (search: Record<string, unknown>) => ({
    sectionId:
      typeof search.sectionId === "string" ? search.sectionId : undefined,
  }),
  component: EditorPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "*",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  docsRoute,
  adminRoute,
  adminEditRoute,
  adminNewRoute,
  notFoundRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </>
  );
}
