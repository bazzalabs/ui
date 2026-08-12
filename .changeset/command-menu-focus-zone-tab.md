---
"@bazza-ui/react": patch
---

The command menu now handles Tab explicitly: with tabbable header/footer content, Tab cycles Input → zone controls → Input; with none, Tab is a no-op instead of closing the palette. Initial open focus now always lands on the surface input even when a dialog focus manager pre-focuses a header control.
