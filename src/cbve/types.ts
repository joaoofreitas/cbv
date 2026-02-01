// Interfaces and types for CBVE

// ProgramInfo holds information about a compiled WebGL program
export interface ProgramInfo {
    // Program object
    program: WebGLProgram;
    // Location of attributes in the shader
    attribLocations: {
        // Vertex position attribute location
        vertexPosition: number;
    };
    // Location of uniforms in the shader
    uniformLocations: {
        // Projection matrix uniform location
        projectionMatrix: WebGLUniformLocation | null;
        // Model-view matrix uniform location
        modelViewMatrix: WebGLUniformLocation | null;
    };
}

// Geometry interface represents the geometry data for a 3D object
export interface Geometry {
    positions: Float32Array;
    indices: Uint16Array;
    center: { x: number; y: number; z: number };
    // We can add colors or normals here later
}

// Latitude and Longitude coordinates in decimal degrees
export interface Coordinates {
    lat: number;
    lon: number;
}

// Latitude and Longitude coordinates in meters relative to an anchor point
export interface CoordinatesMeters {
    x: number;
    y: number;
}
