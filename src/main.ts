import { mat4 } from 'gl-matrix';
import { Shaders } from './engine/shaders'
import { vsSource, fsSource } from './shaders/shaders'

const canvas = document.querySelector('#glCanvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl');
if (gl === null) {
    console.error("Unable to initialize WebGL. Your browser or machine may not support it.");
}

// Set canvas size to fill the window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
gl!.viewport(0, 0, canvas.width, canvas.height);

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
    // Get the size the browser is displaying the canvas in CSS pixels
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Check if the canvas is not the same size.
    if (canvas.width !== width || canvas.height !== height) {
        // Make the canvas the same size
        canvas.width = width;
        canvas.height = height;

        // Update the WebGL viewport
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        return true;
    }
    return false;
}

if (!gl) {
    throw new Error("WebGL not supported");
}

const shaderProgram = Shaders.InitShader(gl, vsSource, fsSource);

// Interface for Program Info context
interface ProgramInfo {
    program: WebGLProgram | null;
    attribLocations: {
        vertexPosition: number;
    };
    uniformLocations: {
        projectionMatrix: WebGLUniformLocation | null;
        modelViewMatrix: WebGLUniformLocation | null;
    }
}

const programInfo: ProgramInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram!, 'aVertexPosition'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram!, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram!, 'uModelViewMatrix'),
    },
};

// Draw Scene
// Set clear color to a dark "map" aesthetic
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clearDepth(1.0);
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);

gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


// Field of View in Radians
const fov: number = (45 * Math.PI) / 180;
// Aspect Ratio is important for precise prespective
const aspect: number = gl.canvas.width / gl.canvas.height;
//  Z near and far clipping planes
const zNear: number = 0.1;
// Z far clipping plane
const zFar: number = 100.0;


// Setup perspective matrix
const projectionMatrix: mat4 = mat4.create();
mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

// Model View Matrix shifted back 6 units
const modelViewMatrix: mat4 = mat4.create();
mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

setPositionAttribute(gl, programInfo, modelViewMatrix, projectionMatrix);
gl.useProgram(programInfo.program);
gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);
gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

const offset = 0;
const vertexCount = 4;
gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);



interface Buffers {
    position: WebGLBuffer | null;
}

function initBuffers(gl: WebGLRenderingContext): Buffers {
    const positionBuffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Square vertex positions
    const positions = new Float32Array([
        1.0, 1.0,  // Top Right
        -1.0, 1.0,  // Top Left
        1.0, -1.0,  // Bottom Right
        -1.0, -1.0   // Bottom Left
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    let buffers: Buffers = {
        position: positionBuffer,
    }

    return buffers;
}

// Tells WebGL how to pull out the positions from the position buffer into the vertexPosition attribute
//
// @param gl - WebGLRenderingContext - WebGL rendering context
// @param programInfo - ProgramInfo - Program information
// @param modelViewMatrix - mat4 - Model view matrix
// @param projectionMatrix - mat4 - Projection matrix
function setPositionAttribute(gl: WebGLRenderingContext, programInfo: ProgramInfo, modelViewMatrix: mat4, projectionMatrix: mat4) {
    const numComponents = 2;  // pull out 2 values per iteration
    const type = gl.FLOAT;    // the data in the buffer is 32bit floats
    const normalize = false;  // don't normalize
    const stride = 0;

    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, initBuffers(gl).position);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset);

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}





