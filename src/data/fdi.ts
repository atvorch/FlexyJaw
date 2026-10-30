/** FDI (two-digit) tooth numbering. */

/** Tooth meshes in capture order: 0-13 upper arch (patient right → left), 14-27 lower arch (patient left → right). */
export const FDI_BY_MESH_ORDER = [
  17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27,
  37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47,
] as const;

/** Dental chart layout as seen from the front: patient's right on the left. */
export const CHART_ROWS: readonly (readonly number[])[] = [
  [17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27],
  [47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37],
];

const TYPE: Record<number, string> = {
  1: 'central incisor',
  2: 'lateral incisor',
  3: 'canine',
  4: 'first premolar',
  5: 'second premolar',
  6: 'first molar',
  7: 'second molar',
};
const QUADRANT: Record<number, string> = { 1: 'upper right', 2: 'upper left', 3: 'lower left', 4: 'lower right' };

export const isUpper = (fdi: number) => fdi < 30;
export const toothName = (fdi: number) => `${QUADRANT[Math.floor(fdi / 10)]} ${TYPE[fdi % 10]}`;
