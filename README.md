# cbv
A WebGL city buildings visualizer based on OSM data

## References

- https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial
- https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
- https://overpass-turbo.eu/

## 1. Technical Challenges (The Problems)

| Problem | Technical Reality | Impact |
| :--- | :--- | :--- |
| **Float Precision Jitter** | WebGL 32-bit floats lose precision far from $(0,0,0)$. | Buildings will "flicker" or shake as the camera moves. |
| **Polygon Concavity** | OSM footprints are "Ways" (ordered points), not triangles. | WebGL cannot draw concave shapes; it requires specific triangle indices. |
| **Coordinate Mismatch** | GPS is Spherical (WGS84 Lat/Lon); WebGL is Cartesian (X, Y, Z). | Data will appear warped or be invisible without projection. |
| **The "Flat" Problem** | OSM data is essentially 2D footprints with metadata tags. | Without extrusion logic, the city remains a 2D map. |
| **Batching vs. Entities** | High draw-call counts for 1,000+ individual buildings. | Performance bottlenecking on the CPU-to-GPU bus. |

## 2. Technical Solutions

### Anchor-Based Projection
To solve precision jitter, we pick a **Reference Anchor** (the first Lat/Lon coordinate). All other points are converted to "Meters from Anchor." This keeps coordinates small and precise near the origin.

### Ear Clipping Triangulation
Since we are building from scratch, we implement an **Ear Clipping** algorithm. It iteratively identifies "ears" (convex triangles that contain no other points) and snips them into indices until the polygon is fully triangulated.

### Vertex Extrusion (Walls)
For every point in a 2D footprint, we generate two 3D vertices:
1. **Base Vertex**: `[x, y, 0]`
2. **Roof Vertex**: `[x, y, height]`
We then bridge these points using two triangles per segment to create the building's walls.

### Surface Normals
We calculate face normals using the cross product of triangle edges. This allows our shaders to calculate light intensity, providing the visual depth needed to distinguish walls from roofs.


- [ ] **Coordinate Utility**: Build `cbve.Projection` to convert Lat/Lon to a Cartesian Meter grid.
- [ ] **Data Mocking**: Hardcode a single building footprint to test the projection logic.
- [ ] **Static Mesh**: Render a flat 2D footprint at $Z=0$ to verify coordinates are correct.
- [ ] **Triangulation**: Implement the `EarClipping` function for complex/concave roof shapes.
- [ ] **Extrusion System**: Automate wall generation by connecting base vertices to roof vertices.
- [ ] **Normals & Shaders**: Update the fragment shader to support basic directional lighting (Sun).
- [ ] **OSM Parser**: Fetch and parse GeoJSON/Overpass data into multiple `cbve.Mesh` objects.
- [ ] **Camera System**: Implement basic fly-controls (WASD + Mouse) to navigate the 3D space.
- [ ] **Environment**: Add a ground plane and basic depth fog for scale.

## 4. Implementation Strategy
* **Constraint 1**: Ignore "Holes" (donuts). Assume all building footprints are solid polygons.
* **Constraint 2**: Use a local flat-earth approximation (Mercator). Global curvature is irrelevant at city scale.
* **Constraint 3**: Performance first. Use `gl.drawElements` exclusively to keep the GPU throughput high.
