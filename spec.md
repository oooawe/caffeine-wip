# GitBook-Style Documentation App

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Hierarchical sidebar navigation with sections and nested pages
- Rich text editor (Markdown-based) for creating/editing documentation pages
- Markdown rendering for the reader view
- Full-text search across all pages
- Clean, readable documentation layout (reader mode)
- Admin panel for content management (CRUD for sections and pages)
- Authorization to protect admin panel

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan

### Backend (Motoko)
- Data models: Section { id, title, order }, Page { id, sectionId, title, slug, content (Markdown), order, createdAt, updatedAt }
- APIs:
  - getSections() -> [Section]
  - getPages() -> [Page]
  - getPage(id) -> ?Page
  - searchPages(query) -> [Page]
  - createSection(title) -> Section (admin)
  - updateSection(id, title) -> Bool (admin)
  - deleteSection(id) -> Bool (admin)
  - createPage(sectionId, title, slug, content) -> Page (admin)
  - updatePage(id, title, slug, content) -> Bool (admin)
  - deletePage(id) -> Bool (admin)
  - reorderSections([id]) -> Bool (admin)
  - reorderPages(sectionId, [id]) -> Bool (admin)
- Seed sample documentation content on init

### Frontend
- Layout: sidebar (left) + main content area
- Sidebar: collapsible sections with nested page links, active state, search bar
- Reader view: rendered Markdown with typography, table of contents
- Editor view: Markdown textarea with preview toggle, save/cancel
- Admin panel: manage sections and pages (add, edit, delete, reorder)
- Search modal: full-text search with results highlighting
- Routing: /docs/:pageSlug, /admin, /admin/pages/:id
