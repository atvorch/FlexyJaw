import { Box3, BufferAttribute, BufferGeometry, Matrix4, Vector3 } from 'three';
import { FDI_BY_MESH_ORDER } from './fdi';
import type { Axis, GumModel, JawModel, ToothModel } from './model';
import type { RawJawData } from './types';

async function gunzipBase64(b64: string): Promise<ArrayBuffer> {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).arrayBuffer();
}

function dequantize(q: Uint16Array, min: number[], max: number[]): Float32Array {
  const out = new Float32Array(q.length);
  for (let i = 0; i < q.length; i++) {
    const a = i % 3;
    out[i] = min[a] + (q[i] / 65535) * (max[a] - min[a]);
  }
  return out;
}

// slice() copies, so typed-array alignment never depends on the packed offsets
const u16 = (buf: ArrayBuffer, offset: number, count: number) => new Uint16Array(buf.slice(offset, offset + count * 2));
const u32 = (buf: ArrayBuffer, offset: number, count: number) => new Uint32Array(buf.slice(offset, offset + count * 4));

function decodeTeeth(raw: RawJawData, buf: ArrayBuffer): ToothModel[] {
  const teeth: ToothModel[] = [];
  raw.meshes.forEach((m, meshIndex) => {
    if (m.kind !== 'tooth') return;
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(dequantize(u16(buf, m.vOff, m.nv * 3), m.min, m.max), 3));
    geometry.setIndex(new BufferAttribute(m.idx32 ? u32(buf, m.iOff, m.ni) : u16(buf, m.iOff, m.ni), 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    const center = geometry.boundingBox!.getCenter(new Vector3());
    const size = geometry.boundingBox!.getSize(new Vector3());
    const extents: [Axis, number][] = [['x', size.x], ['y', size.y], ['z', size.z]];
    const longAxis = extents.reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    const index = teeth.length;
    const fdi = FDI_BY_MESH_ORDER[index];
    teeth.push({
      index,
      fdi,
      upper: fdi < 30,
      geometry,
      center,
      size,
      longAxis,
      stageMatrices: raw.toothStages.map((stage) => new Matrix4().fromArray(stage[meshIndex]!)),
    });
  });
  return teeth;
}

function decodeGums(raw: RawJawData, buf: ArrayBuffer): GumModel[] {
  const decoded = raw.gums.map((g) => {
    const stagePositions = g.posOffs.map((o) => dequantize(u16(buf, o, g.nv * 3), g.min, g.max));
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(stagePositions[0].slice(), 3));
    geometry.setIndex(new BufferAttribute(u16(buf, g.idxOff, g.ni), 1));
    geometry.computeVertexNormals();
    let zSum = 0;
    for (let k = 2; k < stagePositions[0].length; k += 3) zSum += stagePositions[0][k];
    return { geometry, stagePositions, meanZ: zSum / g.nv };
  });
  // -z is up, so the gum sitting higher (more negative z) is the upper one
  const topZ = Math.min(...decoded.map((g) => g.meanZ));
  return decoded.map(({ geometry, stagePositions, meanZ }) => ({ geometry, stagePositions, upper: meanZ === topZ }));
}

function computeBounds(teeth: ToothModel[], gums: GumModel[]): Box3 {
  const bounds = new Box3();
  for (const t of teeth) bounds.union(t.geometry.boundingBox!.clone().applyMatrix4(t.stageMatrices[0]));
  for (const g of gums) {
    g.geometry.computeBoundingBox();
    bounds.union(g.geometry.boundingBox!);
  }
  return bounds;
}

export async function loadJawModel(url = `${import.meta.env.BASE_URL}data/jaw.json`): Promise<JawModel> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  const raw: RawJawData = await res.json();
  const [teethBuf, gumBuf] = await Promise.all([gunzipBase64(raw.teethBin), gunzipBase64(raw.gumBin)]);
  const teeth = decodeTeeth(raw, teethBuf);
  const gums = decodeGums(raw, gumBuf);
  return { teeth, gums, stageCount: raw.toothStages.length, bounds: computeBounds(teeth, gums) };
}
