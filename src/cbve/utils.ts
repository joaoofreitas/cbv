import { type Geometry } from "../cbve/types";

export class BuildingFactory {
    private static METERS_PER_LEVEL = 7;

    static createMesh(feature: any): Geometry {
        const allRings = feature.geometry.coordinates; // This is now an array of rings
        const levels = parseInt(feature.properties["building:levels"]) || 1;
        const height = levels * this.METERS_PER_LEVEL

        const anchorLon = allRings[0][0][0];
        const anchorLat = allRings[0][0][1];

        const positions: number[] = [];
        const indices: number[] = [];
        let vertexOffset = 0;

        for (const ring of allRings) {
            // Generate walls for EACH ring (outer and inner)
            for (let i = 0; i < ring.length; i++) {
                const pos = this.latLonToMeters(ring[i][1], ring[i][0], anchorLat, anchorLon);
                positions.push(pos.x, 0, pos.y);      // Ground
                positions.push(pos.x, height, pos.y); // Roof
            }

            // Generate wall indices for this specific ring
            const ringVertexCount = ring.length;
            for (let i = 0; i < ringVertexCount - 1; i++) {
                const current = vertexOffset + i * 2;
                const next = vertexOffset + (i + 1) * 2;

                // Two triangles for the wall segment
                indices.push(current, next, current + 1);
                indices.push(current + 1, next, next + 1);
            }

            vertexOffset += ringVertexCount * 2;
        }

        return {
            positions: new Float32Array(positions),
            indices: new Uint16Array(indices)
        };
    }

    private static triangulate(points: { x: number, y: number }[]): number[] {
        const indices: number[] = [];
        // Copy point indices into a working array (remove the duplicate last point if OSM has it)
        let pIdx = Array.from({ length: points.length - 1 }, (_, i) => i);

        // Ensure clockwise/counter-clockwise winding
        if (this.getArea(points, pIdx) < 0) pIdx.reverse();

        let iterations = 0;
        while (pIdx.length > 3 && iterations < 500) {
            for (let i = 0; i < pIdx.length; i++) {
                const prev = pIdx[(i + pIdx.length - 1) % pIdx.length];
                const curr = pIdx[i];
                const next = pIdx[(i + 1) % pIdx.length];

                if (prev === undefined || curr === undefined || next === undefined) {
                    console.warn("Undefined index in triangulation");
                    continue;
                }

                if (this.isEar(prev!, curr, next, points, pIdx)) {
                    indices.push(prev!, curr, next);
                    pIdx.splice(i, 1);
                    break;
                }
            }
            iterations++;
        }

        if (pIdx.length !== 3) {
            console.warn("Triangulation failed or too complex, remaining points:", pIdx.length);
        }
        indices.push(pIdx[0]!, pIdx[1]!, pIdx[2]!);
        return indices;
    }

    private static isEar(p1: number, p2: number, p3: number, points: { x: number, y: number }[], pIdx: number[]): boolean {
        const a = points[p1], b = points[p2], c = points[p3];
        if (a === undefined || b === undefined || c === undefined) return false;
        // Must be convex
        if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0) return false;

        // Must not contain any other points
        for (const idx of pIdx) {
            if (idx === p1 || idx === p2 || idx === p3) continue;
            if (this.pointInTriangle(points[idx], a, b, c)) return false;
        }
        return true;
    }

    private static pointInTriangle(p: any, a: any, b: any, c: any): boolean {
        const det = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
        const b1 = ((b.y - c.y) * (p.x - c.x) + (c.x - b.x) * (p.y - c.y)) / det;
        const b2 = ((c.y - a.y) * (p.x - c.x) + (a.x - c.x) * (p.y - c.y)) / det;
        const b3 = 1 - b1 - b2;
        return b1 > 0 && b2 > 0 && b3 > 0;
    }

    private static getArea(points: any[], pIdx: number[]): number {
        let area = 0;
        for (let i = 0; i < pIdx.length; i++) {
            const j = (i + 1) % pIdx.length;

            if (pIdx[i] === undefined || pIdx[j] === undefined) {
                return 0;
            }
            const currIdx: number = pIdx[i]!;
            const nextIdx: number = pIdx[j]!;

            const p1 = points[currIdx];
            const p2 = points[nextIdx];

            if (p1 && p2) {
                area += p1.x * p2.y;
                area -= p1.y * p2.x;
            }
        }
        return area / 2;
    }

    private static latLonToMeters(lat: number, lon: number, anchorLat: number, anchorLon: number) {
        const R = 6378137;
        const x = (lon - anchorLon) * (Math.PI / 180) * R * Math.cos(anchorLat * Math.PI / 180);
        const y = (lat - anchorLat) * (Math.PI / 180) * R;
        return { x, y };
    }
}


