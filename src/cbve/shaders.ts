import { type ProgramInfo } from './types';

// Shaders class to handle shader creation and compilation
export class Shaders {
    // Static method that compiles and links vertex and fragment shaders into a WebGL program
    //
    // @param gl: WebGLRenderingContext - The WebGL rendering context
    // @param vsSource: string - The source code of the vertex shader
    // @param fsSource: string - The source code of the fragment shader
    //
    // @returns ProgramInfo - An object containing the program and its attribute/uniform locations
    static createProgram(gl: WebGLRenderingContext, vsSource: string, fsSource: string): ProgramInfo {
        const program = gl.createProgram()!;
        const vs = this.loadShader(gl, gl.VERTEX_SHADER, vsSource)!;
        const fs = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource)!;

        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Shader Link Error: ${gl.getProgramInfoLog(program)}`);
        }

        return {
            program: program,
            attribLocations: {
                vertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
            },
            uniformLocations: {
                projectionMatrix: gl.getUniformLocation(program, 'uProjectionMatrix'),
                modelViewMatrix: gl.getUniformLocation(program, 'uModelViewMatrix'),
            }
        };
    }

    private static loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
        const shader = gl.createShader(type)!;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader Compile Error: ${info}`);
        }
        return shader;
    }
}
