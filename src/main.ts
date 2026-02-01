import { mat4, vec3 } from 'gl-matrix';
import { cbve } from './cbve';
import { Cube } from './models/models';
import { data } from '../data/data';

// Assuming your shaders are exported as strings from this file
import { vsSource, fsSource } from './shaders/shaders';

// Setup Canvas and WebGL Context
const canvas = document.querySelector('#glCanvas') as HTMLCanvasElement;
const gl = canvas.getContext('webgl');
// Enable standard derivatives extension for better lighting calculations
gl!.getExtension('OES_standard_derivatives');

if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    throw new Error('WebGL not supported');
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl!.viewport(0, 0, canvas.width, canvas.height);
}
window.addEventListener('resize', resize);
resize();

// Initialize Engine Components (Shaders, Renderer, Mesh)
// We compile shaders once at the start
const programInfo = cbve.Shaders.createProgram(gl, vsSource, fsSource);
if (!programInfo) {
    throw new Error('Failed to initialize shader program');
}
const renderer = new cbve.Renderer(gl, programInfo);
const feature = data.features[0];
const buildingMesh = cbve.BuildingFactory.createMesh(feature);
const cubeMesh = new cbve.Mesh(gl, buildingMesh);

const cube: Cube = new Cube();
//const cubeMesh = new cbve.Mesh(gl, cube);

//  Global Cube State
let cubeRotation = 0.0;
let lastTime = 0;

// Render Loop
function render(now: number) {
    // Calculate deltaTime so rotation speed is consistent regardless of FPS
    const deltaTime = (now - lastTime) * 0.001;
    lastTime = now;

    cubeRotation += deltaTime;

    // WebGL Configuration per frame
    gl!.clearColor(0.1, 0.1, 0.1, 1.0);
    gl!.clearDepth(1.0);
    gl!.enable(gl!.DEPTH_TEST);
    gl!.depthFunc(gl!.LEQUAL);
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    // Camera Setup
    const aspect: number = canvas.width / canvas.height;
    const fov: number = 45 * Math.PI / 180; // in radians
    const z_near: number = 0.1;
    const z_far: number = 10000.0;

    // Definition of Matrix for Camera Position and angle
    const eye = vec3.fromValues(100, 75, 100); // Camera position
    const center = vec3.fromValues(0, 0, 0); // Where the camera is looking at
    const up = vec3.fromValues(0, 1, 0); // Up direction

    // Setup Matrices
    const projectionMatrix: mat4 = mat4.create();
    mat4.perspective(projectionMatrix, fov, aspect, z_near, z_far);

    const modelViewMatrix = mat4.create();
    // Set the camera view
    mat4.lookAt(modelViewMatrix, eye, center, up);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 1, 0]);   // Rotate Y

    // Draw 
    renderer.draw(cubeMesh, projectionMatrix, modelViewMatrix);
    requestAnimationFrame(render);
}

// Start the engine
requestAnimationFrame(render);
