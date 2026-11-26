---
'@bazza-ui/react': patch
---

Name menu groups in a way VoiceOver keeps announcing. With options inside `role="group"`, VoiceOver stops reading the highlighted option in every browser, so no group renders `role="group"` or `role="radiogroup"` any more: `Group`, `RadioGroup`, `CheckboxGroup` and the default data-first group containers all render `role="presentation"`, and the data-first containers drop their `aria-label`. A group with a name now renders a `hidden` copy of it, and every option in the group points `aria-describedby` at it, ahead of any ids passed to the option's own `aria-describedby`. An unlabelled group inside a labelled one, such as a `RadioGroup` inside a `Group`, keeps the outer group's name on its options.

`Group`, `RadioGroup` and `CheckboxGroup` take a new `label` prop that sets the group's name. Without it, the group is named by its `GroupLabel`'s text, and it keeps that text after the label row unmounts, so a group that stays mounted around the rows of a windowed list keeps its options described once the label scrolls away. A group whose window opens past its label row needs `label`, since its `GroupLabel` never mounts.

`RadioGroup` and `CheckboxGroup` no longer set `aria-disabled`; their items still do. Tests that find a group's label by its text alone, such as `getByText('Fruits')`, now find two matches.
