import { mat4, vec3 } from 'gl-matrix';
import { cbve } from './cbve';
import { data } from '../data/data';
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

// Input Tracker
const keys: Record<string, boolean> = {};

window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

// For the mouse, let's add "Orbit" controls (click and drag to rotate)
let isDragging = false;
let rotation = { x: 0, y: 0 };

canvas.addEventListener('mousedown', () => isDragging = true);
window.addEventListener('mouseup', () => isDragging = false);
window.addEventListener('mousemove', (e) => {
    if (isDragging) {
        rotation.x -= e.movementX * 0.005; // Horizontal rotation
        rotation.y -= e.movementY * 0.005; // Vertical rotation
    }
});

// Initialize Engine Components (Shaders, Renderer, Mesh)
// We compile shaders once at the start
const programInfo = cbve.Shaders.createProgram(gl, vsSource, fsSource);
if (!programInfo) {
    throw new Error('Failed to initialize shader program');
}

const renderer = new cbve.Renderer(gl, programInfo);
const map: Record<string, Building> = cbve.MapBuilder.build(data.features);
const meshes = Object.values(map).map(building => new cbve.Mesh(gl, building.geometry));

const eye = vec3.fromValues(300, 300, 300); // Backed up to see the "map"
const target = vec3.fromValues(0, 0, 0);
const up = vec3.fromValues(0, 1, 0);

let distance = 500; // Distance from camera to target
function updateCamera() {
    const moveSpeed = 5.0;

    // 1. Calculate direction vectors from target to eye
    // This allows movement relative to the current view
    if (keys['w']) distance -= moveSpeed;
    if (keys['s']) distance += moveSpeed;

    // Simple panning of the target
    if (keys['a']) target[0] -= moveSpeed;
    if (keys['d']) target[0] += moveSpeed;

    // Clamp zoom distance
    distance = Math.max(10, Math.min(distance, 5000));

    // 2. Update eye position based on rotation and distance
    // This creates a "Spherical" orbit camera
    eye[0] = target[0] + distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    eye[1] = target[1] + distance * Math.sin(rotation.y);
    eye[2] = target[2] + distance * Math.cos(rotation.x) * Math.cos(rotation.y);
}



function render() {
    updateCamera();
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, aspect, 0.1, 10000.0);

    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, eye, target, up);



    Object.values(map).forEach((building, index) => {
        const mesh = meshes[index];
        if (!mesh) return;

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, viewMatrix, [
            building.geometry.center.x,
            0,
            building.geometry.center.z
        ]);

        renderer.draw(mesh, projectionMatrix, modelViewMatrix);
    });

    requestAnimationFrame(render);
}

// Start the engine
requestAnimationFrame(render);
