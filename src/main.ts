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
// For the mouse, let's add "Orbit" controls (click and drag to rotate)
let rotation = { x: 0, y: 0 };
let isLeftDragging = false;
let isRightDragging = false;

// Disable right-click menu so we can use it for rotation
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) isLeftDragging = true; // Left click
    if (e.button === 2) isRightDragging = true; // Right click
});
window.addEventListener('mouseup', () => {
    isLeftDragging = false;
    isRightDragging = false;
});
window.addEventListener('mousemove', (e) => {
    if (isRightDragging) {
        rotation.x -= e.movementX * 0.005;
        rotation.y = Math.max(-1.5, Math.min(Math.PI / 1.5, rotation.y - e.movementY * 0.005));
    }
    else if (isLeftDragging) {
        // Panning (Moving the target)
        // We move the target relative to where the camera is facing
        const forwardX = Math.sin(currentRotation.x);
        const forwardZ = Math.cos(currentRotation.x);
        const panSpeed = currentDistance * 0.001; // Pan faster when zoomed out

        target[0] -= (forwardZ * e.movementX - forwardX * e.movementY) * panSpeed;
        target[2] -= (forwardX * e.movementX + forwardZ * e.movementY) * panSpeed;
    }
});

window.addEventListener('wheel', (e) => {
    // Zooming
    distance = Math.max(50, Math.min(5000, distance + e.deltaY));
}, { passive: false });

// Initialize Engine Components (Shaders, Renderer, Mesh)
// We compile shaders once at the start
const programInfo = cbve.Shaders.createProgram(gl, vsSource, fsSource);
if (!programInfo) {
    throw new Error('Failed to initialize shader program');
}

const renderer = new cbve.Renderer(gl, programInfo);
const map: Record<string, cbve.Building> = cbve.MapBuilder.build(data.features);

const meshes = Object.values(map).map(building => new cbve.Mesh(gl, building.geometry));

const eye = vec3.fromValues(300, 300, 300); // Backed up to see the "map"
const target = vec3.fromValues(0, 0, 0);
const up = vec3.fromValues(0, 1, 0);

let distance = 500;
let currentRotation = { x: 0, y: 0 };
let currentTarget = vec3.clone(target);
let currentDistance = distance;
function updateCamera() {
    const lerp = 0.15; // Smoothness factor

    // Interpolate values
    currentRotation.x += (rotation.x - currentRotation.x) * lerp;
    currentRotation.y += (rotation.y - currentRotation.y) * lerp;
    currentDistance += (distance - currentDistance) * lerp;
    vec3.lerp(currentTarget, currentTarget, target, lerp);

    // Cap camera always above ground level
    let nextEyeY = currentTarget[1] + currentDistance * Math.sin(currentRotation.y);
    const minHeight = 10;
    if (nextEyeY < minHeight) {
        nextEyeY = minHeight;
    }

    // Update eye based on smoothed values
    eye[0] = currentTarget[0] + currentDistance * Math.sin(currentRotation.x) * Math.cos(currentRotation.y);
    eye[1] = currentTarget[1] + currentDistance * Math.sin(currentRotation.y);
    eye[2] = currentTarget[2] + currentDistance * Math.cos(currentRotation.x) * Math.cos(currentRotation.y);
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
