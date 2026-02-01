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
        const allRings = feature.geometry.coordinates;
        const levels = parseInt(feature.properties["building:levels"]) || 1;
        console.log(`Creating building with ${levels} levels`);
        const height = levels * Building.METERS_PER_LEVEL;

        // Calculating the center of the building for positioning
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        const anchorLon = allRings[0][0][0];
        const anchorLat = allRings[0][0][1];

        const positions: number[] = [];
        const indices: number[] = [];

        // Earcut specific data structures
        const flatCoords: number[] = []; // [x, z, x, z, ...]
        const holeIndices: number[] = [];
        let globalVertexCount = 0;

        for (let r = 0; r < allRings.length; r++) {
            const ring = allRings[r];

            // Record where the hole starts in the flat array
            if (r > 0) {
                holeIndices.push(flatCoords.length / 2);
            }

            for (let i = 0; i < ring.length; i++) {
                const pos = this.latLonToMeters(ring[i][1], ring[i][0], anchorLat, anchorLon);
                // Update the center calculation
                minX = Math.min(minX, pos.x);
                maxX = Math.max(maxX, pos.x);
                minZ = Math.min(minZ, pos.y);
                maxZ = Math.max(maxZ, pos.y);


                // For Earcut (Roof Triangulation)
                flatCoords.push(pos.x, pos.y);

                // For Walls (Standard Vertices)
                positions.push(pos.x, 0, pos.y);      // Ground
                positions.push(pos.x, height, pos.y); // Roof
            }

            // Wall Indices (Only if it's not the duplicate closing point)
            const ringVertexCount = ring.length;
            const ringOffset = globalVertexCount;
            for (let i = 0; i < ringVertexCount - 1; i++) {
                const current = ringOffset + i * 2;
                const next = ringOffset + (i + 1) * 2;
                indices.push(current, next, current + 1);
                indices.push(current + 1, next, next + 1);
            }
            globalVertexCount += ringVertexCount * 2;
        }

        const center = {
            x: (minX + maxX) / 2,
            y: height / 2, // Half the building height
            z: (minZ + maxZ) / 2
        };

        // Eearcut for Roof Triangulation
        const roofIndices = earcut(flatCoords, holeIndices);
        // Map Earcut's indices back to our interleaved positions array
        for (const idx of roofIndices) {
            // idx refers to the coordinate pair in flatCoords.
            // In our 'positions', that same point's Roof vertex is at idx * 2 + 1
            indices.push(idx * 2 + 1);
        }

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
