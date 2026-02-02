import earcut from 'earcut';
import type { Coordinates, CoordinatesMeters, Geometry } from "../cbve/types";


// This class represents a Building with its metadata and 3D geometry
export class Building {
    // Sets the average height per building level in meters
    private static METERS_PER_LEVEL = 3.5;

    // Name of the Building
    public name: string = "Unnamed Building";
    // Type of the Building (e.g., residential, commercial)
    public type: string = "Building";
    // Number of floors/levels
    public levels: number = 1;
    // Street address (if available)
    public street: string = "";
    // Geometry data for rendering
    public geometry: Geometry;
    // Anchor point for coordinate conversion
    private anchor: Coordinates;

    // Constructor takes a GeoJSON feature and an anchor point
    // 
    // @param feature: any- GeoJSON feature representing the building
    // @param anchor: Coordinates - Anchor point for coordinate conversion
    constructor(feature: any, anchor: Coordinates) {
        this.parseMetadata(feature);
        this.anchor = anchor;
        this.geometry = this.createMesh(feature)
    }

    // Parse GeoJSON feature to create building mesh form OSM Data
    //
    // @param feature: any - GeoJSON feature representing the building
    private parseMetadata(feature: any): void {
        this.name = feature.properties["name"] || "Unnamed Building";
        this.type = feature.properties["building"] || "Building";
        this.levels = parseInt(feature.properties["building:levels"]) || 1;
        this.street = feature.properties["addr:street"] || "";
    }

    // Create 3D mesh geometry from GeoJSON feature
    // 
    // @param feature: any - GeoJSON feature representing the building
    private createMesh(feature: any): Geometry {
        // 1. Normalize coordinates to always be an array of polygons
        const polygons = feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates
            : [feature.geometry.coordinates];

        const levels = parseInt(feature.properties["building:levels"]) || 1;
        const height = levels * Building.METERS_PER_LEVEL;

        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

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
                    //const pos = this.coordinatesToMeters(ring[i][1], ring[i][0], this.anchor.lat, this.anchor.lon);
                    let coor: Coordinates = { lat: ring[i][1], lon: ring[i][0] };
                    const pos = this.coordinatesToMeters(coor, this.anchor);

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
    // TODO: Convert this to a Helper Static Class (Shared with mapbuilder)
    // Convert geographic coordinates to meters relative to an anchor point
    //
    // @param coor: Coordinates - Geographic coordinates to convert
    // @param anchor: Coordinates - Anchor point for conversion
    //
    // @returns CoordinatesMeters - Converted coordinates in meters
    private coordinatesToMeters(coor: Coordinates, anchor: Coordinates): CoordinatesMeters {
        const R = 6378137;
        return {
            x: (coor.lon - anchor.lon) * (Math.PI / 180) * R * Math.cos(anchor.lat * Math.PI / 180),
            y: (coor.lat - anchor.lat) * (Math.PI / 180) * R
        }
    }
}
