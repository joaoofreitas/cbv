import { mat4 } from 'gl-matrix';
import { cbve } from './cbve';
import { data } from '../data/data';

import { vsSource, fsSource } from './shaders/shaders';
import { CameraController } from './camera';

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
    console.warn("Could not initialize shaders");
}

const renderer = new cbve.Renderer(gl, programInfo);
const map: Record<string, cbve.Building> = cbve.MapBuilder.build(data.features);
const meshes = Object.values(map).map(building => new cbve.Mesh(gl, building.geometry));

// Camera Setup
const camera_controller = new CameraController(canvas);

function render() {
    // Update the Camera
    camera_controller.update();
    gl!.clear(gl!.COLOR_BUFFER_BIT | gl!.DEPTH_BUFFER_BIT);

    const aspect = canvas.width / canvas.height;
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, 45 * Math.PI / 180, aspect, 0.1, 10000.0);

    let viewMatrix = camera_controller.getViewMatrix();

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
