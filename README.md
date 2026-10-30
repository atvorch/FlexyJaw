# Jaw Editor

A browser viewer for an aligner treatment plan (18 stages, 28 teeth plus gums) that lets you rotate and move individual teeth at the final stage and compare them with the original plan.

## Files

- `index.html` — the whole app (three.js loaded from a CDN).
- `jaw-data.js` — the tooth and gum meshes plus per-stage tooth transforms, captured from the plan's 3D share page. This is personal dental data: keep the repository private.

## Running

The page loads `jaw-data.js` and three.js modules, so serve the folder over HTTP rather than opening the file directly:

```bash
python -m http.server 8731
```

Then open http://127.0.0.1:8731/index.html. An internet connection is needed for three.js.

## Features

- Stage slider and playback (0–17); gums deform per stage.
- Select a tooth (click it or use the tooth chart) and rotate or move it with the gizmo or sliders. Editing is limited to the final stage.
- Adjustments are saved in the browser and can be exported or imported as JSON.
- Toggles: apply adjustments (A), highlight adjusted teeth (H), show the original jaw above with an adjustable gap, gums / upper / lower.
- Changed-teeth bar: open a tooth's comparison with a before/after divider, free rotation, zoom and a larger view, plus the change described in plain terms.
- Front view button (F).
