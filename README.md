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
    persistence.ts localStorage save/load, JSON export/import
    history.ts     undo/redo step model and step labels
  scene/       everything inside the main <Canvas>
    JawScene.tsx   composition root of the 3D scene
    Tooth.tsx      one editable tooth (stage transform → pivot → mesh)
    AdjustedJaw / OriginalJaw / GumDeformer / ToothGizmo / CameraRig / StagePlayer / JawLabels / Lighting
    materials.ts, registry.ts, colorSetup.ts
  components/  DOM UI
    viewport/      Viewport (canvas + overlays), HistoryBar, FrontViewButton, ShortcutHint, ToothTooltip
    sidebar/       Sidebar, StageControls, DisplayToggles, ToothChart, ToothEditor, SliderRow, AdjustmentsPanel
    compare/       ChangesBar, CompareDrawer, CompareViewer (before/after divider), CompareModal, ChangeTable
  hooks/       useKeyboardShortcuts
  styles/      theme, layout and per-area CSS
```

Per-frame work (stage playback, tooth transforms, gum deformation) reads the store with `getState()` inside `useFrame`, so animation doesn't re-render React. Components subscribe only to what they display.

## Features

- Stage slider and playback (0–17); gums deform per stage.
- Select a tooth (click it or use the tooth chart) and rotate or move it with the gizmo or sliders. Editing is limited to the final stage.
- Adjustments are saved in the browser and can be exported or imported as JSON.
- Toggles: apply adjustments (A), highlight adjusted teeth (H), show the original jaw above with an adjustable gap, gums / upper / lower.
- Changed-teeth bar: open a tooth's comparison with a before/after divider, free rotation, zoom and a larger view, plus the change described in plain terms.
- Summary for orthodontist: every changed tooth in clinical terms (crown torque, tip, mesial-in/out rotation, translation, intrusion/extrusion) with a plain-words note, copyable as text, downloadable or printable.
- History timeline at the bottom: every settled change is a step; scrub, undo (Ctrl+Z) and redo (Ctrl+Y / Ctrl+Shift+Z). The timeline lasts for the session; the current adjustments are what gets saved.
- Front view (F), gizmo mode rotate (R) / move (G), Esc closes the innermost panel.
