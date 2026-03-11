import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

actor {
  // --- Authorization ---
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func requireAdmin(caller : Principal) {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: admin only");
    };
  };

  // --- Types ---
  public type Section = {
    id : Nat;
    title : Text;
    order : Nat;
    createdAt : Int;
  };

  public type Page = {
    id : Nat;
    sectionId : Nat;
    title : Text;
    slug : Text;
    content : Text;
    order : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  // --- State ---
  var nextSectionId : Nat = 1;
  var nextPageId : Nat = 1;
  let sections = Map.empty<Nat, Section>();
  let pages = Map.empty<Nat, Page>();
  var seeded : Bool = false;

  // --- Seed ---
  func seed() {
    if (seeded) return;
    seeded := true;
    let now = Time.now();

    sections.add(1, { id = 1; title = "Getting Started"; order = 1; createdAt = now });
    sections.add(2, { id = 2; title = "Writing Docs"; order = 2; createdAt = now });
    sections.add(3, { id = 3; title = "Advanced"; order = 3; createdAt = now });
    nextSectionId := 4;

    pages.add(1, { id = 1; sectionId = 1; title = "Introduction"; slug = "introduction"; content = "# Introduction\n\nWelcome to **DocuBase** - your GitBook-style documentation platform.\n\nDocuBase makes it easy to create, organize, and publish beautiful documentation.\n\n## Features\n\n- Hierarchical sidebar navigation\n- Markdown-based rich text editing\n- Full-text search\n- Admin panel for content management\n\n## Quick Start\n\n1. Browse documentation using the sidebar\n2. Use the search bar to find specific topics\n3. Log in as admin to manage content"; order = 1; createdAt = now; updatedAt = now });
    pages.add(2, { id = 2; sectionId = 1; title = "Installation"; slug = "installation"; content = "# Installation\n\nDocuBase runs on the Internet Computer and requires no local installation.\n\n## Admin Access\n\nTo access the admin panel:\n\n1. Click **Admin** in the navigation\n2. Log in with your Internet Identity\n3. Enter the admin token provided during setup"; order = 2; createdAt = now; updatedAt = now });
    pages.add(3, { id = 3; sectionId = 1; title = "Configuration"; slug = "configuration"; content = "# Configuration\n\nDocuBase can be configured through the admin panel.\n\n## Section Management\n\nSections group related pages together. You can:\n- Add new sections\n- Rename sections\n- Delete sections (removes all pages within)"; order = 3; createdAt = now; updatedAt = now });
    pages.add(4, { id = 4; sectionId = 2; title = "Markdown Basics"; slug = "markdown-basics"; content = "# Markdown Basics\n\nDocuBase uses Markdown for all page content.\n\n## Text Formatting\n\n- **Bold**: `**text**`\n- *Italic*: `*text*`\n- `Code`: wrap in backticks\n\n## Lists\n\n- Unordered item\n1. Ordered item\n\n## Code Blocks\n\nWrap code in triple backticks with an optional language identifier."; order = 1; createdAt = now; updatedAt = now });
    pages.add(5, { id = 5; sectionId = 2; title = "Page Structure"; slug = "page-structure"; content = "# Page Structure\n\nEvery documentation page has:\n\n## Title\n\nThe page title appears in the sidebar and as the page heading.\n\n## Slug\n\nThe slug is the URL-friendly identifier (e.g., `getting-started`).\n\n## Content\n\nPage content is written in Markdown.\n\n> **Tip:** Keep pages focused on a single topic for better readability."; order = 2; createdAt = now; updatedAt = now });
    pages.add(6, { id = 6; sectionId = 3; title = "Search"; slug = "search"; content = "# Search\n\nDocuBase includes full-text search.\n\n## Using Search\n\nClick the search bar in the sidebar or press `/` to open the search modal.\n\nSearch looks through:\n- Page titles\n- Page content"; order = 1; createdAt = now; updatedAt = now });
    pages.add(7, { id = 7; sectionId = 3; title = "Admin Panel"; slug = "admin-panel"; content = "# Admin Panel\n\nThe admin panel allows you to manage all documentation content.\n\n## Accessing Admin\n\nNavigate to `/admin` and authenticate with your Internet Identity.\n\n## Managing Sections\n\n- **Add Section**: Click New Section and enter a title\n- **Edit Section**: Click the edit icon next to a section\n- **Delete Section**: Click the delete icon\n\n## Managing Pages\n\n- **Add Page**: Click New Page within a section\n- **Edit Page**: Click the edit icon on any page\n- **Delete Page**: Click the delete icon on any page"; order = 2; createdAt = now; updatedAt = now });
    nextPageId := 8;
  };

  seed();

  // --- Public Queries ---
  public query func getSections() : async [Section] {
    let arr = Array.fromIter(sections.values());
    arr.sort(func(a : Section, b : Section) : { #less; #equal; #greater } {
      Nat.compare(a.order, b.order)
    })
  };

  public query func getPages() : async [Page] {
    let arr = Array.fromIter(pages.values());
    arr.sort(func(a : Page, b : Page) : { #less; #equal; #greater } {
      if (a.sectionId != b.sectionId) {
        Nat.compare(a.sectionId, b.sectionId)
      } else {
        Nat.compare(a.order, b.order)
      }
    })
  };

  public query func getPage(id : Nat) : async ?Page {
    pages.get(id)
  };

  public query func getPageBySlug(slug : Text) : async ?Page {
    for ((_, page) in pages.entries()) {
      if (page.slug == slug) return ?page;
    };
    null
  };

  public query func searchPages(searchQuery : Text) : async [Page] {
    let q = searchQuery.toLower();
    if (q.size() == 0) return [];
    Array.fromIter(pages.values()).filter(func(p : Page) : Bool {
      p.title.toLower().contains(#text q) or p.content.toLower().contains(#text q)
    })
  };

  // --- Admin Mutations ---
  public shared ({ caller }) func createSection(title : Text) : async Section {
    requireAdmin(caller);
    let id = nextSectionId;
    nextSectionId += 1;
    let s : Section = { id; title; order = id; createdAt = Time.now() };
    sections.add(id, s);
    s
  };

  public shared ({ caller }) func updateSection(id : Nat, title : Text) : async Bool {
    requireAdmin(caller);
    switch (sections.get(id)) {
      case (null) { false };
      case (?s) {
        sections.add(id, { id = s.id; title; order = s.order; createdAt = s.createdAt });
        true
      };
    }
  };

  public shared ({ caller }) func deleteSection(id : Nat) : async Bool {
    requireAdmin(caller);
    if (sections.get(id) == null) {
      false
    } else {
      sections.remove(id);
      let toDelete = Array.fromIter(pages.entries()).filter(
        func((_, p) : (Nat, Page)) : Bool { p.sectionId == id }
      );
      for ((pid, _) in toDelete.vals()) {
        pages.remove(pid);
      };
      true
    }
  };

  public shared ({ caller }) func createPage(sectionId : Nat, title : Text, slug : Text, content : Text) : async Page {
    requireAdmin(caller);
    let id = nextPageId;
    nextPageId += 1;
    let now = Time.now();
    let p : Page = { id; sectionId; title; slug; content; order = id; createdAt = now; updatedAt = now };
    pages.add(id, p);
    p
  };

  public shared ({ caller }) func updatePage(id : Nat, title : Text, slug : Text, content : Text) : async Bool {
    requireAdmin(caller);
    switch (pages.get(id)) {
      case (null) { false };
      case (?p) {
        pages.add(id, { id = p.id; sectionId = p.sectionId; title; slug; content; order = p.order; createdAt = p.createdAt; updatedAt = Time.now() });
        true
      };
    }
  };

  public shared ({ caller }) func deletePage(id : Nat) : async Bool {
    requireAdmin(caller);
    if (pages.get(id) == null) {
      false
    } else {
      pages.remove(id);
      true
    }
  };
};
