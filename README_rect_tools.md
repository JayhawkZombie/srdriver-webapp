# Rect Template Editor: Design & Architecture Guide
 # Rect Template Editor: Design & Architecture Guide

## Purpose
A compact, powerful tool for designing LED show cues and templates, optimized for speed, clarity, and creative flow.

---

## 1. Essential Fields
- **Template Name**: Editable, always visible.
- **Type**: (Pulse, Pattern, Cue, Settings Change, etc.)
- **Default Duration**: Numeric input (ms/s toggle if needed).
- **Palette**: Selector with preview, edit, and create options.
- **Default Data**: Key-value pairs for custom parameters (color, speed, etc.).
- **Device/Track Assignment**: (Optional) Assign to device/track or leave unassigned.

### Advanced/Pro Fields
- **Tags/Labels**: For grouping/searching templates.
- **Notes/Description**: Designer notes or cues.
- **Preview**: Live, always-visible preview.
- **Hotkey/Shortcut**: For quick assignment/triggering.
- **Version/History**: (Optional) See previous edits or revert.

---

## 2. UI/UX Layout Suggestions
- **Header**: Name, type, palette selector (with preview/edit).
- **Main Section**: Duration, default data, device/track assignment.
- **Sidebar/Footer**: Tags, notes, advanced options (collapsible).
- **Preview Area**: Small, always visible, live updates.
- **Actions**: Save, Duplicate, Delete, Create New (always accessible).

**Compactness Tips:**
- Inline editing for names, tags, etc.
- Popovers for advanced/less-used fields.
- Group related fields visually (cards, dividers, subtle backgrounds).
- Icons with tooltips for actions and less-frequently used fields.

---

## 3. What’s Useful for Show Designers?
- **Speed**: Quick creation, duplication, assignment.
- **Clarity**: Immediate visual feedback (previews, color, assignment).
- **Organization**: Easy to find, group, and search templates (tags, filters).
- **Flexibility**: Add custom fields, edit palettes on the fly.
- **Undo/Redo**: (If possible) Experiment safely.
- **Consistency**: Re-usable UI bits everywhere.

---

## 4. Pro Features to Consider
- **Batch Editing**: Edit multiple templates at once.
- **Template Import/Export**: Share between projects/collaborators.
- **Timeline Integration**: Drag-and-drop onto timeline/track.
- **Parameter Automation**: Automate/modulate fields over time.
- **Device/Track Preview**: See assignments, jump to them.
- **Locking/Pinning**: Prevent accidental edits.

---

## 5. Reusable UI Components
- **Palette Selector/Editor**: For any color/style selection.
- **Compact Card Rows**: For lists of templates, devices, tracks, cues.
- **Inline Editable Fields**: For names, tags, quick edits.
- **Popover Editors**: For advanced/less-used settings.
- **Icon Buttons with Tooltips**: For all actions.
- **Slider + Icon Controls**: For any parameter adjustment.

---

## 6. Stateless, Composable Architecture
- **All components should be stateless** (except for local UI state like popovers/inputs).
- **State lives in a global store** (e.g., Zustand) or is passed down via props.
- **Each UI piece is a pure function of its props/state.**
- **Palette, template, and assignment logic are modular and re-usable.**
- **Preview components are pure and receive all data via props.**
- **No hidden side effects or implicit state.**
- **Easy to test, reason about, and refactor.**

---

## 7. Thought-Provoking Prompts for Ongoing Improvement
- What’s the fastest way for a designer to create, preview, and assign a new cue?
- How can we make bulk editing and organization effortless?
- What visual feedback would make a designer feel confident and inspired?
- How can we make it easy to share, import, or remix templates?
- What would a “pro” user want to automate or script?
- How can we surface the most-used actions without clutter?
- What’s missing that would make this tool “fun” to use, not just functional?
- How can we ensure the UI never gets in the way of creative flow?
- What would make this tool the first thing a lighting designer recommends to a friend?

---

**Keep iterating, keep asking questions, and keep designing for delight!**
