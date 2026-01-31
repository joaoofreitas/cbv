import { type ProgramInfo } from './types';
import { Mesh } from './mesh';
import { mat4 } from 'gl-matrix';

// Renderer class to handle drawing of meshes
export class Renderer {
    // Constructor to initialize the Renderer with WebGL context and program info
    // 
    // @param gl: WebGLRenderingContext -  WebGL rendering context
    // @param programInfo: ProgramInfo - Information about the shader program
    constructor(private gl: WebGLRenderingContext, private programInfo: ProgramInfo) { }

    // Draws a mesh using the provided projection and model-view matrices
    //
    // @param mesh: Mesh - The mesh to be drawn
    // @param projectionMatrix: mat4 - The projection matrix
    // @param modelViewMatrix: mat4 - The model-view matrix
    draw(mesh: Mesh, projectionMatrix: mat4, modelViewMatrix: mat4) {
        const gl = this.gl;

        // Set the shader program to use
        gl.useProgram(this.programInfo.program);

        // Set the shader uniforms
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
        gl.uniformMatrix4fv(this.programInfo.uniformLocations.modelViewMatrix, false, modelViewMatrix);

        // Bind the position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positionBuffer);
        gl.vertexAttribPointer(this.programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.programInfo.attribLocations.vertexPosition);

        // Draw the mesh
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.indexBuffer);
        gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    }
}
