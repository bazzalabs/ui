---
'@bazza-ui/react': patch
---

Keep a data-first subpage open when the menu's `content` changes while it is open. Before, any new `content` array sent the menu back to its first page. Now the open page stays, with its search and highlight, as long as its id is still in the new content; a page whose id is gone closes, leaving the deepest page that is still there. This holds for pages that loaders added too: rows from the root's `asyncContent` (append or replace mode), from an open page's own loader, and from a data-first submenu's loader, including when the submenu's parent row re-renders. One case still closes: a page loaded by another page's loader inside a submenu, when the root `content` changes.
