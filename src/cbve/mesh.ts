import { type Geometry } from './types';

// Mesh class to handle vertex positions and indices for WebGL rendering
export class Mesh {
    // Position Buffer: WebGLBuffer to hold vertex positions
    positionBuffer: WebGLBuffer;
    // Index Buffer: WebGLBuffer to hold vertex indices
    indexBuffer: WebGLBuffer;
    // Count vertex indices
    count: number;
    // Geometry data interface
    data: Geometry;

    // Constructor to create and initialize the Mesh
    // 
    // @param gl: WebGLRenderingContext - The WebGL rendering context
    // @param positions: Float32Array - Array of vertex positions
    // @param indices: Uint16Array - Array of vertex indices
    constructor(gl: WebGLRenderingContext, data: Geometry) {
        this.data = data;
        this.count = data.indices.length;

        // Ask GPU for a chunk of memory
        this.positionBuffer = gl.createBuffer()!;
        // Bind the buffer to the position attribute buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        // Set the position data to the buffer
        gl.bufferData(gl.ARRAY_BUFFER, this.data.positions, gl.STATIC_DRAW);
        // Create another buffer
        this.indexBuffer = gl.createBuffer()!;
        // Bind it to the index array buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        // Bind the index data
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.data.indices, gl.STATIC_DRAW);
    }
}
