import { Building } from './building';
import { type Coordinates } from './types';

// This Static Class builds a Map of Buildings from GeoJSON Features
export class MapBuilder {
    // Returns a Record (Map) where the key is the Feature ID and value is a Building
    static build(features: any[]): Record<string, Building> {
        const buildings: Record<string, Building> = {};

        // Use a consistent anchor for the whole map
        const firstFeature = features[0];
        const anchor = this.getFeatureAnchor(firstFeature);

        features.forEach(feature => {
            const id = feature.id || feature.properties.id || Math.random().toString();
            // The Building constructor now just handles data + geometry generation
            buildings[id] = new Building(feature, anchor);
        });

        return buildings;
    }

    // TODO: Repeated code in building.ts
    // Get anchor coordinates from a GeoJSON feature
    //
    // @param feature: any - GeoJSON feature
    //
    // @returns Coordinates - Anchor coordinates (lon, lat)
    private static getFeatureAnchor(feature: any): Coordinates {
        const coords = feature.geometry.type === "MultiPolygon"
            ? feature.geometry.coordinates[0][0][0]
            : feature.geometry.coordinates[0][0];

        return { lon: coords[0], lat: coords[1] };
    }
}
