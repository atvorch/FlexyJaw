import { create } from 'zustand';
import type { JawModel } from '../data/model';
import { isUpper } from '../data/fdi';
import { isEdited, type Adjustments, type ToothAdjustment } from '../domain/adjustments';
import { HISTORY_LIMIT, HISTORY_SETTLE_MS, describeStep, type HistoryEntry } from './history';
import { loadAdjustments, saveAdjustments } from './persistence';

export type GizmoMode = 'rotate' | 'translate';

export interface Visibility {
  gums: boolean;
  upper: boolean;
  lower: boolean;
}

export interface JawState {
  model: JawModel | null;

  // treatment stage
  stage: number;
  playing: boolean;

  // display
  visibility: Visibility;
  applyAdjustments: boolean;
  highlightAdjusted: boolean;
  showOriginal: boolean;
  originalGapMm: number;
  /** Bumped to ask the camera to glide back to the front view. */
  frontViewRequest: number;

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

  /** Summary-for-orthodontist window. */
  reportOpen: boolean;

  setModel(model: JawModel): void;
  setStage(stage: number): void;
  togglePlay(): void;
  stopPlay(): void;
  setVisibility(patch: Partial<Visibility>): void;
  setApplyAdjustments(on: boolean): void;
  setHighlightAdjusted(on: boolean): void;
  setShowOriginal(on: boolean): void;
  setOriginalGap(mm: number): void;
  requestFrontView(): void;
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
  commitHistory(): void;
  goToHistory(index: number): void;
  undo(): void;
  redo(): void;
  setReportOpen(open: boolean): void;
}

export const lastStage = (s: Pick<JawState, 'model'>) => (s.model ? s.model.stageCount - 1 : 0);

/** Teeth can only be changed at the final stage, with adjustments shown. */
export const selectCanEdit = (s: JawState) => !!s.model && s.applyAdjustments && s.stage === lastStage(s);

const toothVisible = (fdi: number, v: Visibility) => (isUpper(fdi) ? v.upper : v.lower);

/** Keep the comparison drawer only while its tooth still has a change to show. */
const comparedAfter = (s: JawState, adjustments: Adjustments) => {
  const compared = s.compared != null && isEdited(adjustments[s.compared]) ? s.compared : null;
  return { compared, compareExpanded: compared == null ? false : s.compareExpanded };
};

const initialAdjustments = loadAdjustments();
let settleTimer: ReturnType<typeof setTimeout> | undefined;

export const useJawStore = create<JawState>()((set, get) => ({
  model: null,
  stage: 0,
  playing: false,
  visibility: { gums: true, upper: true, lower: true },
  applyAdjustments: true,
  highlightAdjusted: false,
  showOriginal: false,
  originalGapMm: 8,
  frontViewRequest: 0,
  adjustments: initialAdjustments,
  selected: null,
  hovered: null,
  gizmoMode: 'rotate',
  compared: null,
  compareExpanded: false,
  history: [{ adjustments: initialAdjustments, label: 'Start of session', at: Date.now() }],
  historyIndex: 0,
  reportOpen: false,

  setModel: (model) => set({ model, stage: model.stageCount - 1 }),

  setStage: (stage) => set((s) => ({ stage: Math.max(0, Math.min(lastStage(s), stage)) })),
  togglePlay: () =>
    set((s) => (s.playing ? { playing: false } : { playing: true, stage: s.stage >= lastStage(s) ? 0 : s.stage })),
  stopPlay: () => set({ playing: false }),

  setVisibility: (patch) =>
    set((s) => {
      const visibility = { ...s.visibility, ...patch };
      const selected = s.selected != null && !toothVisible(s.selected, visibility) ? null : s.selected;
      return { visibility, selected };
    }),
  setApplyAdjustments: (applyAdjustments) => set({ applyAdjustments }),
  setHighlightAdjusted: (highlightAdjusted) => set({ highlightAdjusted }),
  setShowOriginal: (showOriginal) => set((s) => ({ showOriginal, frontViewRequest: s.frontViewRequest + 1 })),
  setOriginalGap: (originalGapMm) => set({ originalGapMm }),
  requestFrontView: () => set((s) => ({ frontViewRequest: s.frontViewRequest + 1 })),

  setAdjustment: (fdi, adjustment) =>
    set((s) => {
      const adjustments: Record<number, ToothAdjustment> = { ...s.adjustments };
      if (isEdited(adjustment)) adjustments[fdi] = adjustment;
      else delete adjustments[fdi];
      return { adjustments, ...comparedAfter(s, adjustments) };
    }),
  resetTooth: (fdi) => get().setAdjustment(fdi, { rotation: [0, 0, 0], move: [0, 0, 0] }),
  resetAll: () => set({ adjustments: {}, compared: null, compareExpanded: false }),
  replaceAdjustments: (adjustments) => set((s) => ({ adjustments, ...comparedAfter(s, adjustments) })),

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

  commitHistory: () => {
    clearTimeout(settleTimer);
    set((s) => {
      const current = s.history[s.historyIndex];
      if (s.adjustments === current.adjustments) return {};
      const label = describeStep(current.adjustments, s.adjustments);
      if (label === 'No change') return {};
      // a new change after stepping back discards the steps ahead
      const history = [...s.history.slice(0, s.historyIndex + 1), { adjustments: s.adjustments, label, at: Date.now() }];
      const overflow = Math.max(0, history.length - HISTORY_LIMIT);
      return { history: history.slice(overflow), historyIndex: history.length - 1 - overflow };
    });
  },
  goToHistory: (index) => {
    get().commitHistory(); // don't lose an edit that hasn't settled yet
    set((s) => {
      const i = Math.max(0, Math.min(s.history.length - 1, index));
      const adjustments = s.history[i].adjustments;
      return { historyIndex: i, adjustments, ...comparedAfter(s, adjustments) };
    });
  },
  undo: () => {
    get().commitHistory();
    get().goToHistory(get().historyIndex - 1);
  },
  redo: () => get().goToHistory(get().historyIndex + 1),

  setReportOpen: (reportOpen) => set({ reportOpen }),
}));

useJawStore.subscribe((state, prev) => {
  if (state.adjustments === prev.adjustments) return;
  saveAdjustments(state.adjustments);
  // edits (not history navigation) become a history step once they settle
  if (state.adjustments !== state.history[state.historyIndex].adjustments) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => useJawStore.getState().commitHistory(), HISTORY_SETTLE_MS);
  }
});
