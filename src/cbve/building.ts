import earcut from 'earcut';
import { type Geometry } from "../cbve/types";

export class Building {
    private static METERS_PER_LEVEL = 3.5;

    public name: string = "Unnamed Building";
    public type: string = "Building";
    public levels: number = 1;
    public street: string = "";
    public geometry: Geometry;


    constructor(feature: any) {
        this.parseMetadata(feature);
        this.geometry = this.createMesh(feature);
    }

    // Parse GeoJSON feature to create building mesh form OSM Data
    private parseMetadata(feature: any): void {
        this.name = feature.properties["name"] || "Unnamed Building";
        this.type = feature.properties["building"] || "Building";
        this.levels = parseInt(feature.properties["building:levels"]) || 1;
        this.street = feature.properties["addr:street"] || "";
    }
    private createMesh(feature: any): Geometry {
        // 1. Normalize coordinates to always be an array of polygons
        const polygons = feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];

        const levels = parseInt(feature.properties["building:levels"]) || 1;
        const height = levels * Building.METERS_PER_LEVEL;

        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        // Use the first point of the first polygon as the anchor
        const anchorLon = polygons[0][0][0][0];
        const anchorLat = polygons[0][0][0][1];

        const positions: number[] = [];
        const indices: number[] = [];

        // This tracks the total vertices added across ALL polygons
        let globalVertexOffset = 0;

        for (const polygon of polygons) {
            const flatCoords: number[] = [];
            const holeIndices: number[] = [];

            // This tracks vertices for THIS specific polygon part
            let polyVertexCount = 0;

            for (let r = 0; r < polygon.length; r++) {
                const ring = polygon[r];

                if (r > 0) {
                    holeIndices.push(flatCoords.length / 2);
                }

                for (let i = 0; i < ring.length; i++) {
                    const pos = this.latLonToMeters(ring[i][1], ring[i][0], anchorLat, anchorLon);

                    minX = Math.min(minX, pos.x);
                    maxX = Math.max(maxX, pos.x);
                    minZ = Math.min(minZ, pos.y);
                    maxZ = Math.max(maxZ, pos.y);

                    flatCoords.push(pos.x, pos.y);
                    positions.push(pos.x, 0, pos.y);
                    positions.push(pos.x, height, pos.y);
                }

                // Wall Indices for this ring
                const ringVertexCount = ring.length;
                for (let i = 0; i < ringVertexCount - 1; i++) {
                    // We use globalVertexOffset to ensure indices point to the right spot in the array
                    const current = globalVertexOffset + i * 2;
                    const next = globalVertexOffset + (i + 1) * 2;

                    indices.push(current, next, current + 1);
                    indices.push(current + 1, next, next + 1);
                }

                polyVertexCount += ringVertexCount;
                globalVertexOffset += ringVertexCount * 2;
            }

            // --- Roof Triangulation for THIS Polygon Part ---
            const roofIndices = earcut(flatCoords, holeIndices);

            // We need to find where this specific polygon started in the global positions array
            // (Current offset minus the vertices we just added for this specific poly)
            const polyStartOffset = globalVertexOffset - (polyVertexCount * 2);

            for (const idx of roofIndices) {
                // idx is local to the current 'flatCoords' array
                indices.push(polyStartOffset + (idx * 2 + 1));
            }
        }

        const center = {
            x: (minX + maxX) / 2,
            y: height / 2,
            z: (minZ + maxZ) / 2
        };

        return {
            positions: new Float32Array(positions),
            indices: new Uint16Array(indices),
            center: center
        };
    }

    private latLonToMeters(lat: number, lon: number, anchorLat: number, anchorLon: number) {
        const R = 6378137;
        const x = (lon - anchorLon) * (Math.PI / 180) * R * Math.cos(anchorLat * Math.PI / 180);
        const y = (lat - anchorLat) * (Math.PI / 180) * R;
        return { x, y };
    }
}
