// node art/scripts/meshopt_v1.mjs in.glb out.glb
// Re-packs an EXT_meshopt_compression GLB as KHR_meshopt_compression: every vertex (attribute/animation) stream re-encoded with
// meshopt's v1 vertex codec at its highest level (three r186's MeshoptDecoder reads it). Lossless: each stream is
// decoded (filters left as stored) and re-encoded, and the decode of the new stream must match byte for byte.
// Nothing else in the file changes (nodes, materials, textures, animations, accessors).
import fs from 'node:fs';
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);

const [src, dst] = process.argv.slice(2);
const glb = fs.readFileSync(src);
if (glb.readUInt32LE(0) !== 0x46546c67) throw new Error('not a GLB');
const jsonLen = glb.readUInt32LE(12);
const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString('utf8'));
const bin = glb.subarray(20 + jsonLen + 8, 20 + jsonLen + 8 + glb.readUInt32LE(20 + jsonLen));
const EXT = 'EXT_meshopt_compression', KHR = 'KHR_meshopt_compression';
if (!json.extensionsUsed?.includes(EXT)) throw new Error('no EXT_meshopt_compression in ' + src);

const decode = (m, data) => {
  const out = new Uint8Array(m.count * m.byteStride);
  MeshoptDecoder.decodeGltfBuffer(out, m.count, m.byteStride, data, m.mode, 'NONE');
  return out;
};

// Rebuild buffer 0 (the GLB's BIN chunk) in bufferView order, 4-byte aligned (16 for meshopt streams).
const parts = []; let size = 0;
const put = (bytes, align) => { const pad = (align - (size % align)) % align; if (pad) { parts.push(new Uint8Array(pad)); size += pad; } const at = size; parts.push(bytes); size += bytes.length; return at; };
for (const bv of json.bufferViews) {
  const m = bv.extensions?.[EXT];
  if (m) {
    if (m.buffer !== 0) throw new Error('meshopt stream outside the BIN chunk');
    const old = bin.subarray(m.byteOffset ?? 0, (m.byteOffset ?? 0) + m.byteLength);
    let enc = old; // index streams stay as they are (the index codec has no newer version)
    if (m.mode === 'ATTRIBUTES') {
      const raw = decode(m, old);
      enc = MeshoptEncoder.encodeVertexBufferLevel(raw, m.count, m.byteStride, 3, 1);
      if (!Buffer.from(decode(m, enc)).equals(Buffer.from(raw))) throw new Error('round trip mismatch');
      if (enc.length > old.length) enc = old; // never bigger (a v0 stream is valid KHR too)
    }
    m.byteOffset = put(enc, 16); m.byteLength = enc.length;
    delete bv.extensions[EXT]; bv.extensions[KHR] = m;
  } else if (bv.buffer === 0) {
    bv.byteOffset = put(bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength), 4);
  }
}
json.buffers[0].byteLength = size;
for (const b of json.buffers) if (b.extensions?.[EXT]) { b.extensions[KHR] = b.extensions[EXT]; delete b.extensions[EXT]; }
for (const k of ['extensionsUsed', 'extensionsRequired']) if (json[k]) json[k] = json[k].map((e) => (e === EXT ? KHR : e));

const pad4 = (b, fill) => { const p = (4 - (b.length % 4)) % 4; return p ? Buffer.concat([b, Buffer.alloc(p, fill)]) : b; };
const jsonBuf = pad4(Buffer.from(JSON.stringify(json)), 0x20), binBuf = pad4(Buffer.concat(parts), 0);
const head = Buffer.alloc(12); head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4);
head.writeUInt32LE(12 + 8 + jsonBuf.length + 8 + binBuf.length, 8);
const chunk = (len, type) => { const c = Buffer.alloc(8); c.writeUInt32LE(len, 0); c.writeUInt32LE(type, 4); return c; };
fs.writeFileSync(dst, Buffer.concat([head, chunk(jsonBuf.length, 0x4e4f534a), jsonBuf, chunk(binBuf.length, 0x004e4942), binBuf]));
console.log(`${src}: ${glb.length} -> ${fs.statSync(dst).size} bytes`);
