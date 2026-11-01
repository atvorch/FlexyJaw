import { create } from 'zustand';
import type { JawModel } from '../data/model';
import { isUpper } from '../data/fdi';
import { isEdited, type Adjustments, type ToothAdjustment } from '../domain/adjustments';
import { isArchView, type JawView } from '../domain/layout';
import { HISTORY_LIMIT, HISTORY_SETTLE_MS, changedTeeth, describeStep, type HistoryEntry } from './history';
import { createVersion, loadVersions, readDraft, writeDraft, writeVersions, type Draft, type SavedVersion } from './persistence';
import { readShareLink } from './shareLink';

export type GizmoMode = 'rotate' | 'translate';

export interface Visibility {
  gums: boolean;
  upper: boolean;
  lower: boolean;
}

export interface JawState {
  model: JawModel | null;
  /** Opened from a share link: everything can be looked at, nothing can be changed or saved. */
  viewOnly: boolean;

  // treatment stage
  stage: number;
  playing: boolean;

  // display
  visibility: Visibility;
  applyAdjustments: boolean;
  highlightAdjusted: boolean;
  showOriginal: boolean;
  originalGapMm: number;
  /** Preset the camera should glide to; `viewRequest` is bumped on every request, even for the same view. */
  cameraView: JawView;
  viewRequest: number;
  /** Lit toolbar button; null once the user orbits away from the preset. */
  activeView: JawView | null;
  /** An arch is hidden because a Top / Bottom view hid it (not by the user), so other views bring it back. */
  archHiddenByView: boolean;
  /** When set, the camera's last request was to face this tooth (FDI) rather than a preset view. */
  cameraFocus: number | null;

  // editing
  adjustments: Adjustments;
  selected: number | null;
  hovered: number | null;
  gizmoMode: GizmoMode;

  // comparison drawer
  compared: number | null;
  compareExpanded: boolean;

  // undo / redo timeline of adjustments (this session only)
  history: HistoryEntry[];
  historyIndex: number;
  /**
   * Timelines of the versions that aren't open, so each version keeps its own undo / redo history.
   * Keyed by version id, or ORIGINAL_KEY / UNSAVED_KEY. Session only.
   */
  stashedHistories: Record<string, { history: HistoryEntry[]; index: number }>;

  /** Summary-for-orthodontist window. */
  reportOpen: boolean;

  // named saves: nothing is stored until the user saves
  versions: SavedVersion[];
  /** Adjustments as last saved or loaded; the working copy is "unsaved" while it differs. */
  savedBaseline: Adjustments;
  /** The version last saved or loaded, if any. */
  currentVersionId: string | null;
  saveDialogOpen: boolean;
  /** Looking at the untouched treatment plan. Editing it never changes it: the first change starts a new version. */
  viewingOriginal: boolean;
  /** A version just created from the original whose first edit (e.g. a gizmo drag) is still in progress. */
  forkingVersionId: string | null;
  /** Unsaved changes recovered from a page that closed without saving, waiting for Restore / Discard. */
  pendingDraft: Draft | null;

  setModel(model: JawModel): void;
  setStage(stage: number): void;
  togglePlay(): void;
  stopPlay(): void;
  setVisibility(patch: Partial<Visibility>): void;
  setApplyAdjustments(on: boolean): void;
  setHighlightAdjusted(on: boolean): void;
  setShowOriginal(on: boolean): void;
  setOriginalGap(mm: number): void;
  requestView(view: JawView): void;
  /** The user orbited or zoomed, so no preset is active any more. */
  leaveView(): void;
  /** Glide the camera round to face one tooth; brings its arch back if a Top / Bottom view hid it. */
  focusTooth(fdi: number): void;
  setAdjustment(fdi: number, adjustment: ToothAdjustment): void;
  resetTooth(fdi: number): void;
  resetAll(): void;
  replaceAdjustments(adjustments: Adjustments): void;
  select(fdi: number | null): void;
  hover(fdi: number | null): void;
  setGizmoMode(mode: GizmoMode): void;
  /** Jump to the final stage with adjustments shown and select the tooth for editing. */
  editTooth(fdi: number): void;
  openCompare(fdi: number): void;
  closeCompare(): void;
  setCompareExpanded(on: boolean): void;
  /** Record the current adjustments as a history step now (normally done after changes settle). */
  commitHistory(label?: string): void;
  goToHistory(index: number): void;
  undo(): void;
  redo(): void;
  setReportOpen(open: boolean): void;
  /** Bring back recovered unsaved changes, on top of the version they were made on. */
  restoreDraft(): void;
  discardDraft(): void;
  setSaveDialogOpen(open: boolean): void;
  /** Save the working adjustments as a new named version. @returns false if the browser refused to store it. */
  saveVersion(name: string): boolean;
  /** Replace the current version's adjustments, keeping its name. @returns false if there is none or storing failed. */
  overwriteCurrentVersion(): boolean;
  loadVersion(id: string): void;
  /** Show the original treatment plan, read-only. Picking a saved version leaves it. */
  viewOriginal(): void;
  /** Change a version's name only; its adjustments and save time stay as they are. @returns false if storing failed. */
  renameVersion(id: string, name: string): boolean;
  deleteVersion(id: string): void;
}

/** True while the working adjustments differ from the last save / load (never in view-only mode). */
export const selectUnsaved = (s: JawState) => !s.viewOnly && changedTeeth(s.savedBaseline, s.adjustments).length > 0;

/** Whether a version the user switched away from still holds unsaved edits, waiting for it to be opened again. */
export const selectHasParkedEdits = (s: JawState, id: string) => {
  const parked = s.stashedHistories[id];
  const version = s.versions.find((v) => v.id === id);
  return !!parked && !!version && changedTeeth(version.adjustments, parked.history[parked.index].adjustments).length > 0;
};

/** Unsaved edits anywhere: in the open version, or parked in one the user switched away from. */
export const selectAnyUnsaved = (s: JawState) => {
  if (s.viewOnly) return false;
  if (selectUnsaved(s) || s.versions.some((v) => selectHasParkedEdits(s, v.id))) return true;
  // edits made with no saved version to belong to
  const loose = s.stashedHistories[UNSAVED_KEY];
  return !!loose && Object.keys(loose.history[loose.index].adjustments).length > 0;
};

/**
 * What to open after deleting a version: the one saved just before it, or the next one if it was the oldest.
 * null when nothing else is left.
 */
export function versionAfterDeleting(versions: SavedVersion[], id: string): SavedVersion | null {
  const byDate = [...versions].sort((a, b) => a.savedAt - b.savedAt);
  const i = byDate.findIndex((v) => v.id === id);
  if (i < 0) return null;
  return byDate[i - 1] ?? byDate[i + 1] ?? null;
}

export const lastStage = (s: Pick<JawState, 'model'>) => (s.model ? s.model.stageCount - 1 : 0);

/** A lower tooth is in focus (selected, or open in the comparison), so the upper jaw fades out of its way. */
export const selectFadeUpperJaw = (s: JawState) => {
  const focus = s.selected ?? s.compared;
  return focus != null && !isUpper(focus);
};

/**
 * Whether the original jaw is stacked above the main one. Not while the original plan itself is open: the
 * main jaw then *is* the original, with nothing adjusted to compare against.
 */
export const selectStackOriginal = (s: JawState) => s.showOriginal && !s.viewingOriginal;

/** Teeth can only be changed at the final stage, with adjustments shown, and never from a view-only link. */
export const selectCanEdit = (s: JawState) => !s.viewOnly && !!s.model && s.applyAdjustments && s.stage === lastStage(s);

const toothVisible = (fdi: number, v: Visibility) => (isUpper(fdi) ? v.upper : v.lower);

/** Keep the comparison drawer only while its tooth still has a change to show. */
const comparedAfter = (s: JawState, adjustments: Adjustments) => {
  const compared = s.compared != null && isEdited(adjustments[s.compared]) ? s.compared : null;
  return { compared, compareExpanded: compared == null ? false : s.compareExpanded };
};

// history timeline keys for what isn't a saved version
const ORIGINAL_KEY = '#original';
const UNSAVED_KEY = '#unsaved';
const historyKeyOf = (s: Pick<JawState, 'viewingOriginal' | 'currentVersionId'>) =>
  s.viewingOriginal ? ORIGINAL_KEY : (s.currentVersionId ?? UNSAVED_KEY);

/**
 * Put the open timeline away under its key and bring out the one for `key`, so the history shows only the
 * changes made in the version being opened. A version opened again resumes its own timeline exactly where it
 * was left, unsaved edits included, so switching between versions never loses anything; a version opened for
 * the first time starts at its saved state.
 */
function switchTimeline(s: JawState, key: string, adjustments: Adjustments, label: string) {
  const stashedHistories = { ...s.stashedHistories, [historyKeyOf(s)]: { history: s.history, index: s.historyIndex } };
  const resumed = stashedHistories[key];
  delete stashedHistories[key];
  const { history, index: historyIndex } = resumed ?? { history: [{ adjustments, label, at: Date.now() }], index: 0 };
  // the entry's own object, so the change watcher doesn't mistake the switch for an edit
  return { stashedHistories, history, historyIndex, adjustments: history[historyIndex].adjustments };
}

// A share link decides the starting toggles; a view-only link also brings its own adjustments and
// leaves this browser's saved versions out entirely.
const link = readShareLink();
const viewOnly = link.viewOnly;
// otherwise start from the most recent save, so a fresh session has nothing unsaved
const initialVersions = viewOnly ? [] : loadVersions();
const latestVersion = initialVersions[initialVersions.length - 1];
const initialAdjustments: Adjustments = viewOnly ? (link.adjustments ?? {}) : (latestVersion?.adjustments ?? {});
let settleTimer: ReturnType<typeof setTimeout> | undefined;

/** A recovery copy from last time, if it actually differs from the version it was made on. */
function recoverDraft(): Draft | null {
  if (viewOnly) return null;
  const draft = readDraft();
  if (!draft) return null;
  const base = initialVersions.find((v) => v.id === draft.baseVersionId)?.adjustments ?? {};
  if (changedTeeth(base, draft.adjustments).length) return draft;
  writeDraft(null);
  return null;
}

export const useJawStore = create<JawState>()((set, get) => ({
  model: null,
  viewOnly,
  stage: 0,
  playing: false,
  visibility: { gums: link.gums ?? true, upper: link.upper ?? true, lower: link.lower ?? true },
  applyAdjustments: true,
  highlightAdjusted: link.highlightAdjusted ?? false,
  showOriginal: link.showOriginal ?? false,
  originalGapMm: 8,
  cameraView: 'front',
  viewRequest: 0,
  activeView: 'front',
  archHiddenByView: false,
  cameraFocus: null,
  adjustments: initialAdjustments,
  selected: null,
  hovered: null,
  gizmoMode: 'rotate',
  compared: null,
  compareExpanded: false,
  history: [
    {
      adjustments: initialAdjustments,
      label: viewOnly ? 'Shared view' : latestVersion ? `Opened “${latestVersion.name}”` : 'Start of session',
      at: Date.now(),
    },
  ],
  historyIndex: 0,
  stashedHistories: {},
  reportOpen: false,
  versions: initialVersions,
  savedBaseline: initialAdjustments,
  currentVersionId: latestVersion?.id ?? null,
  saveDialogOpen: false,
  viewingOriginal: false,
  forkingVersionId: null,
  pendingDraft: recoverDraft(),

  setModel: (model) => set({ model, stage: model.stageCount - 1 }),

  setStage: (stage) => set((s) => ({ stage: Math.max(0, Math.min(lastStage(s), stage)) })),
  togglePlay: () =>
    set((s) => (s.playing ? { playing: false } : { playing: true, stage: s.stage >= lastStage(s) ? 0 : s.stage })),
  stopPlay: () => set({ playing: false }),

  setVisibility: (patch) =>
    set((s) => {
      const visibility = { ...s.visibility, ...patch };
      const selected = s.selected != null && !toothVisible(s.selected, visibility) ? null : s.selected;
      // the user took over arch visibility, so later views must not undo their choice
      const archHiddenByView = 'upper' in patch || 'lower' in patch ? false : s.archHiddenByView;
      return { visibility, selected, archHiddenByView };
    }),
  setApplyAdjustments: (applyAdjustments) => set({ applyAdjustments }),
  setHighlightAdjusted: (highlightAdjusted) => set({ highlightAdjusted }),
  // the camera reframes itself whenever the stacking changes (see CameraRig)
  setShowOriginal: (showOriginal) => set({ showOriginal }),
  setOriginalGap: (originalGapMm) => set({ originalGapMm }),
  requestView: (view) =>
    set((s) => {
      let { visibility, archHiddenByView } = s;
      if (isArchView(view)) {
        // looking straight onto one arch's biting surface: the other arch would block it
        visibility = { ...visibility, upper: view === 'upper', lower: view === 'lower' };
        archHiddenByView = true;
      } else if (archHiddenByView) {
        visibility = { ...visibility, upper: true, lower: true };
        archHiddenByView = false;
      }
      const selected = s.selected != null && !toothVisible(s.selected, visibility) ? null : s.selected;
      return {
        cameraView: view,
        cameraFocus: null,
        activeView: view,
        viewRequest: s.viewRequest + 1,
        visibility,
        archHiddenByView,
        selected,
      };
    }),
  leaveView: () => set((s) => (s.activeView == null ? {} : { activeView: null })),
  focusTooth: (fdi) =>
    set((s) => {
      const archShown = isUpper(fdi) ? s.visibility.upper : s.visibility.lower;
      // only undo hiding that a Top / Bottom view did, never the user's own choice
      const visibility = !archShown && s.archHiddenByView ? { ...s.visibility, upper: true, lower: true } : s.visibility;
      return {
        cameraFocus: fdi,
        activeView: null,
        viewRequest: s.viewRequest + 1,
        visibility,
        archHiddenByView: visibility === s.visibility ? s.archHiddenByView : false,
      };
    }),

  // shared links are read-only, whatever tries to change them
  setAdjustment: (fdi, adjustment) =>
    set((s) => {
      if (s.viewOnly) return {};
      const adjustments: Record<number, ToothAdjustment> = { ...s.adjustments };
      if (isEdited(adjustment)) adjustments[fdi] = adjustment;
      else delete adjustments[fdi];
      return { adjustments, ...comparedAfter(s, adjustments) };
    }),
  resetTooth: (fdi) => get().setAdjustment(fdi, { rotation: [0, 0, 0], move: [0, 0, 0] }),
  resetAll: () => set((s) => (s.viewOnly ? {} : { adjustments: {}, compared: null, compareExpanded: false })),
  replaceAdjustments: (adjustments) => set((s) => (s.viewOnly ? {} : { adjustments, ...comparedAfter(s, adjustments) })),

  // only one tooth is in focus at a time: selecting another tooth closes a comparison of a different one,
  // and "highlight adjusted" switches off so the chosen tooth is the only highlighted one
  select: (selected) =>
    set((s) => {
      if (selected == null) return { selected };
      const closeCompare = s.compared != null && s.compared !== selected;
      return { selected, highlightAdjusted: false, ...(closeCompare ? { compared: null, compareExpanded: false } : {}) };
    }),
  hover: (hovered) => set({ hovered }),
  setGizmoMode: (gizmoMode) => set({ gizmoMode }),
  editTooth: (fdi) =>
    set((s) => ({
      applyAdjustments: true,
      highlightAdjusted: false,
      playing: false,
      stage: lastStage(s),
      selected: fdi,
      compareExpanded: false,
    })),

  // ...and opening a comparison drops the selection of any other tooth
  openCompare: (compared) =>
    set((s) => ({ compared, selected: s.selected === compared ? s.selected : null, highlightAdjusted: false })),
  closeCompare: () => set({ compared: null, compareExpanded: false }),
  setCompareExpanded: (compareExpanded) => set({ compareExpanded }),

  commitHistory: (forcedLabel) => {
    clearTimeout(settleTimer);
    set((s) => {
      const current = s.history[s.historyIndex];
      if (s.adjustments === current.adjustments) return {};
      const described = describeStep(current.adjustments, s.adjustments);
      if (described === 'No change') return {};
      const label = forcedLabel ?? described;
      // a new change after stepping back discards the steps ahead
      const history = [...s.history.slice(0, s.historyIndex + 1), { adjustments: s.adjustments, label, at: Date.now() }];
      const overflow = Math.max(0, history.length - HISTORY_LIMIT);
      return { history: history.slice(overflow), historyIndex: history.length - 1 - overflow };
    });
    // the edit that started a version from the original has settled: store its final state in that version
    const s = get();
    if (s.forkingVersionId) {
      const versions = s.versions.map((v) => (v.id === s.forkingVersionId ? { ...v, adjustments: s.adjustments } : v));
      if (writeVersions(versions)) set({ versions, savedBaseline: s.adjustments });
      set({ forkingVersionId: null });
    }
  },
  goToHistory: (index) => {
    get().commitHistory(); // don't lose an edit that hasn't settled yet
    set((s) => {
      const i = Math.max(0, Math.min(s.history.length - 1, index));
      const adjustments = s.history[i].adjustments;
      return { historyIndex: i, adjustments, ...comparedAfter(s, adjustments) };
    });
  },
  // the original plan is read-only, so there is nothing to undo while looking at it
  undo: () => {
    if (get().viewingOriginal) return;
    get().commitHistory();
    get().goToHistory(get().historyIndex - 1);
  },
  redo: () => {
    if (get().viewingOriginal) return;
    get().goToHistory(get().historyIndex + 1);
  },

  setReportOpen: (reportOpen) => set({ reportOpen }),

  restoreDraft: () => {
    const draft = get().pendingDraft;
    if (!draft) return;
    set({ pendingDraft: null });
    const base = get().versions.find((v) => v.id === draft.baseVersionId);
    if (base) {
      if (get().currentVersionId !== base.id) get().loadVersion(base.id);
    } else {
      // the version they were made on is gone: keep them as unsaved changes of their own
      set({ currentVersionId: null, viewingOriginal: false, savedBaseline: {} });
    }
    set((s) => ({ adjustments: draft.adjustments, ...comparedAfter(s, draft.adjustments) }));
    get().commitHistory('Restored unsaved changes');
  },
  discardDraft: () => {
    writeDraft(null);
    set({ pendingDraft: null });
  },
  setSaveDialogOpen: (saveDialogOpen) => set({ saveDialogOpen }),

  saveVersion: (name) => {
    get().commitHistory(); // a pending gizmo drag belongs to what is being saved
    const s = get();
    const version = createVersion(name.trim() || 'Untitled changes', s.adjustments);
    const versions = [...s.versions, version];
    if (!writeVersions(versions)) return false;
    set({ versions, savedBaseline: s.adjustments, currentVersionId: version.id, saveDialogOpen: false });
    return true;
  },
  overwriteCurrentVersion: () => {
    get().commitHistory();
    const s = get();
    if (!s.versions.some((v) => v.id === s.currentVersionId)) return false;
    const versions = s.versions.map((v) =>
      v.id === s.currentVersionId ? { ...v, adjustments: s.adjustments, savedAt: Date.now() } : v,
    );
    if (!writeVersions(versions)) return false;
    set({ versions, savedBaseline: s.adjustments, saveDialogOpen: false });
    return true;
  },
  loadVersion: (id) => {
    const version = get().versions.find((v) => v.id === id);
    if (!version) return;
    get().commitHistory(); // an edit still settling belongs to the version being left
    set((s) => {
      const timeline = switchTimeline(s, id, version.adjustments, `Opened “${version.name}”`);
      return {
        ...timeline,
        savedBaseline: version.adjustments,
        currentVersionId: version.id,
        viewingOriginal: false,
        ...comparedAfter(s, timeline.adjustments),
      };
    });
  },
  viewOriginal: () => {
    get().commitHistory();
    set((s) => {
      const timeline = switchTimeline(s, ORIGINAL_KEY, {}, 'Original plan');
      return {
        ...timeline,
        savedBaseline: timeline.adjustments,
        currentVersionId: null,
        viewingOriginal: true,
        compared: null,
        compareExpanded: false,
        highlightAdjusted: false,
      };
    });
  },
  renameVersion: (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const versions = get().versions.map((v) => (v.id === id ? { ...v, name: trimmed } : v));
    if (!writeVersions(versions)) return false;
    set({ versions });
    return true;
  },
  deleteVersion: (id) => {
    const s = get();
    const fallback = s.currentVersionId === id ? versionAfterDeleting(s.versions, id) : null;
    const versions = s.versions.filter((v) => v.id !== id);
    if (!writeVersions(versions)) return;
    set({ versions });
    if (s.currentVersionId === id) {
      // the open version is gone: open its neighbour, or, with nothing left, show the
      // on-screen adjustments as unsaved instead of pretending they are still saved
      if (fallback) get().loadVersion(fallback.id);
      else set({ currentVersionId: null, savedBaseline: {} });
    }
    // its history goes with it (switching away just put it in the stash)
    set((st) => {
      const stashedHistories = { ...st.stashedHistories };
      delete stashedHistories[id];
      return { stashedHistories };
    });
  },
}));

const forkName = () =>
  `Edited from original · ${new Date().toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`;

useJawStore.subscribe((state, prev) => {
  if (state.adjustments === prev.adjustments) return;
  // the original plan is never changed: its first edit becomes a new, selected version
  if (prev.viewingOriginal && state.viewingOriginal && Object.keys(state.adjustments).length) {
    const version = createVersion(forkName(), state.adjustments);
    const versions = [...state.versions, version];
    if (writeVersions(versions)) {
      useJawStore.setState({
        versions,
        currentVersionId: version.id,
        savedBaseline: state.adjustments,
        viewingOriginal: false,
        forkingVersionId: version.id,
      });
    } else {
      // storage refused: keep editing, but as an unsaved copy rather than the original
      useJawStore.setState({ viewingOriginal: false });
    }
  }
  // edits (not history navigation) become a history step once they settle
  if (state.adjustments !== state.history[state.historyIndex].adjustments) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => useJawStore.getState().commitHistory(), HISTORY_SETTLE_MS);
  }
});

// Keep a recovery copy of unsaved changes, so closing the page without a warning (some embedded browsers
// never show one, and crashes don't ask) loses nothing. Cleared as soon as nothing is unsaved.
const DRAFT_WRITE_DELAY_MS = 300;
let draftTimer: ReturnType<typeof setTimeout> | undefined;
useJawStore.subscribe((state, prev) => {
  if (state.viewOnly || state.pendingDraft) return; // never overwrite a recovered copy before it's answered
  if (state.adjustments === prev.adjustments && state.savedBaseline === prev.savedBaseline && state.currentVersionId === prev.currentVersionId)
    return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    const s = useJawStore.getState();
    if (s.pendingDraft) return;
    writeDraft(selectUnsaved(s) ? { baseVersionId: s.currentVersionId, adjustments: s.adjustments, at: Date.now() } : null);
  }, DRAFT_WRITE_DELAY_MS);
});
