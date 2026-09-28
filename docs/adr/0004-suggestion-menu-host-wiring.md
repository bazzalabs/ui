# The suggestion menu writes its host input's ARIA, and the host forwards keys to it

A suggestion menu's host input is DOM the library doesn't own: a textarea, or a ProseMirror, CodeMirror or Lexical editor. Once a host is attached to the menu's handle, the menu sets and removes the host's `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete` and `aria-haspopup` itself, and consumers must not set those attributes. Keys go the other way. The menu never listens for them. The host calls `handleKeyDown(event)`, which returns `true` when the menu consumed the key. Both directions follow from the same fact: editors keep their attributes and key handling in non-React code with its own ordering, and a component library can't hook into that the same way for every editor.

Writing the attributes is safe because ProseMirror and React both patch attributes against their *own* previous values. They only remove names they set before, and only set names whose value changed (`patchAttributes` in prosemirror-view). So they leave attributes they don't manage alone.

## Considered Options

- **The host reads and applies the attributes** (`getHostAttributes()` plus `subscribe()`): the host owns its DOM, but every highlight change forces a host re-render or an editor transaction just to recompute `aria-activedescendant`, and each editor integration re-implements that plumbing.
- **The menu listens for keys on the attached host**: needs no wiring, but a capture-phase listener runs before every editor keymap (so the menu would have to re-implement each host's exceptions, like ⌘Enter submitting), and a bubble-phase listener runs after the editor has already acted (Enter has split the paragraph).

## Consequences

"Don't set these five attributes yourself" is part of the public contract and must be documented on the handle. Hosts that genuinely need to own their ARIA would need an opt-out that doesn't exist yet.
