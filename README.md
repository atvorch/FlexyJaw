# FlexyJaw — Jaw Editor

A browser viewer for an aligner treatment plan (18 stages, 28 teeth plus gums) that lets you rotate and move individual teeth at the final stage and compare them with the original plan.

Built with React 18, TypeScript, Vite, three.js (via react-three-fiber / drei) and zustand.

## Running

```bash
npm install
npm run dev        # http://127.0.0.1:8731
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Data

`public/data/jaw.json` holds the tooth and gum meshes plus per-stage tooth transforms, captured from the plan's 3D share page. This is personal dental data: keep the repository private, and don't deploy it publicly.

## Architecture

```
src/
  data/        loading and decoding the jaw file (no React)
    types.ts       raw JSON shape
    model.ts       decoded model types (ToothModel, GumModel, JawModel)
    loadJaw.ts     fetch → gunzip → dequantise → three.js geometries
    fdi.ts         FDI tooth numbering and names
  domain/      pure logic on the model (no React, no rendering)
    stage.ts       stage interpolation, adjustment fade-in weight
    adjustments.ts ToothAdjustment type and the matrices it implies
    analysis.ts    arch-relative frame and the plain-language change summary
    layout.ts      original-jaw offset and front camera pose
  state/
    store.ts       zustand store: stage, display toggles, adjustments, selection, comparison
    persistence.ts named saved versions in localStorage, JSON export/import
    history.ts     undo/redo step model and step labels
    shareLink.ts   view-only share URLs: build and read toggles + encoded adjustments
  scene/       everything inside the main <Canvas>
    JawScene.tsx   composition root of the 3D scene
    Tooth.tsx      one editable tooth (stage transform → pivot → mesh)
    AdjustedJaw / OriginalJaw / GumDeformer / ToothGizmo / CameraRig / StagePlayer / JawLabels / Lighting
    materials.ts, registry.ts, colorSetup.ts
  components/  DOM UI
    viewport/      Viewport (canvas + overlays), ViewToolbar, HistoryBar, ShortcutHint, ToothTooltip
    sidebar/       Sidebar, StageControls, DisplayToggles, ToothChart, ToothEditor, SliderRow, AdjustmentsPanel, SaveBar
    versions/      VersionsPanel (collapsible left panel), VersionList
    saves/         SaveDialog (overwrite current version or save as new)
    compare/       ChangesBar, CompareDrawer, CompareViewer (before/after divider), CompareModal, ChangeTable
  hooks/       useKeyboardShortcuts
  styles/      theme, layout and per-area CSS
```

Per-frame work (stage playback, tooth transforms, gum deformation) reads the store with `getState()` inside `useFrame`, so animation doesn't re-render React. Components subscribe only to what they display.

## Features

- Stage slider and playback (0–17); gums deform per stage.
- Select a tooth (click it or use the tooth chart) and rotate or move it with the gizmo or sliders. Editing is limited to the final stage.
- Nothing is saved automatically. Save (button at the bottom of the sidebar, or Ctrl+S) either overwrites the current version or saves a new named one; saved versions are listed in the collapsible left panel: click a card to switch to it (unsaved edits stay with their version, marked "edited", and are back when you reopen it; the Original plan works the same way), or rename / delete it from the card. While anything is unsaved, the sidebar says so and leaving the page asks first. Adjustments can also be exported or imported as JSON.
- Toggles: apply adjustments (A), highlight adjusted teeth (H), show the original jaw above with an adjustable gap, gums / upper / lower.
- Adjusted teeth: a card per changed tooth (a rendered picture of the adjusted tooth over a faint blue outline of the planned one, its number, total rotation and movement). Pictures come from one shared offscreen renderer and redraw shortly after the tooth stops changing. Clicking a card opens its comparison with a before/after divider, free rotation, zoom and a larger view, plus the change described in plain terms.
- Summary for orthodontist: every changed tooth in clinical terms (crown torque, tip, mesial-in/out rotation, translation, intrusion/extrusion) with a plain-words note, copyable as text, downloadable or printable.
- History timeline at the bottom: every settled change is a step; scrub, undo (Ctrl+Z) and redo (Ctrl+Y / Ctrl+Shift+Z). Each version (and the original plan) has its own timeline, resumed when you switch back to it; a version created by Save as new or by editing the original takes over the steps that led to it. Timelines last for the session; the current adjustments are what gets saved.
- The address bar always mirrors the display toggles (`gums`, `upper`, `lower`, `highlight`, `original`; 1 / 0), updated in place without adding Back-button entries, so a reload or bookmark reopens the same view.
- Share (top right) copies a view-only link: `?mode=view&gums=1&upper=1&lower=1&highlight=0&original=0&adj=…`. The toggles reproduce the sharer's view and `adj` carries the tooth adjustments (saved versions only exist in the sharer's browser). In view-only mode editing, saving, versions, history and import/reset are hidden. The link only works for others once the app is deployed somewhere they can reach.
- Camera toolbar at the top: Top (upper arch biting surface), Right, Front, Left, Bottom (lower arch biting surface). Top / Bottom hide the opposite arch; the lit button turns off when you orbit.
- Mouse: drag to orbit, drag with the wheel (or right button) pressed to pan, scroll to zoom.
- Front view (F), gizmo mode rotate (R) / move (G), Esc closes the innermost panel.
