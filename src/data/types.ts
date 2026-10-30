/**
 * Shape of public/data/jaw.json, as captured from the treatment plan's 3D viewer.
 * Binary payloads are gzip + base64; positions are 16-bit quantised against a per-mesh bounding box.
 */
export interface RawMesh {
  kind: 'tooth' | 'gum';
  /** Column-major model matrix at capture time (unused; per-stage matrices live in toothStages). */
  model: number[];
  /** Vertex count (welded). */
  nv: number;
  /** Index count. */
  ni: number;
  idx32: boolean;
  min: [number, number, number];
  max: [number, number, number];
  /** Byte offsets into the decompressed teethBin. */
  vOff: number;
  iOff: number;
}

export interface RawGum {
  nv: number;
  ni: number;
  /** Byte offsets into the decompressed gumBin. */
  idxOff: number;
  posOffs: number[];
  min: [number, number, number];
  max: [number, number, number];
  models: number[][];
}

export interface RawJawData {
  meshes: RawMesh[];
  /** [stage][meshIndex] column-major world matrix; null for gum meshes. */
  toothStages: (number[] | null)[][];
  gums: RawGum[];
  teethBin: string;
  gumBin: string;
}
