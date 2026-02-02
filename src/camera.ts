import { mat4, vec3 } from 'gl-matrix';

//  CameraController handles user input to control the camera's position and orientation 
export class CameraController {
    // Rotaion in radians
    public rotation: { x: number, y: number } = { x: 0, y: 0 };
    // Target position the camera looks at
    public target: vec3 = vec3.fromValues(0, 0, 0);
    // Distance from the target
    public distance: number = 500;

    // Canvas element to attach event listeners
    private canvas: HTMLCanvasElement;

    // Current smoothed values
    // Rotation of the Camera
    private currentRotation: { x: number, y: number } = { x: 0, y: 0 };
    // Current camera target position
    private currentTarget: vec3 = vec3.create();
    // Current Distance from target
    private currentDistance: number = 500;
    // Is the left mouse button being dragged
    private isLeftDragging: boolean = false;
    // Is the right mouse button being dragged
    private isRightDragging: boolean = false;

    // Eye vector
    public eye: vec3 = vec3.create();

    // Constructor initializes the camera controller with the given canvas
    // 
    // @param canvas - The HTML canvas element to attach event listeners to
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.initEvents();
    }

    // Initialize event listeners for mouse interactions
    private initEvents() {
        // Disable right-click menu so we can use it for rotation
        this.canvas.addEventListener('contextmenu', e => e.preventDefault());
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) this.isLeftDragging = true; // Left click
            if (e.button === 2) this.isRightDragging = true; // Right click
        });
        window.addEventListener('mouseup', () => {
            this.isLeftDragging = false;
            this.isRightDragging = false;
        });
        window.addEventListener('mousemove', (e) => {
            if (this.isRightDragging) {
                this.rotation.x -= e.movementX * 0.005;
                this.rotation.y = Math.max(-1.5, Math.min(Math.PI / 1.5, this.rotation.y - e.movementY * 0.005));
            }
            else if (this.isLeftDragging) {
                // Panning (Moving the target)
                // We move the target relative to where the camera is facing
                const forwardX = Math.sin(this.currentRotation.x);
                const forwardZ = Math.cos(this.currentRotation.x);
                const panSpeed = this.currentDistance * 0.001; // Pan faster when zoomed out

                this.target[0] -= (forwardZ * e.movementX - forwardX * e.movementY) * panSpeed;
                this.target[2] -= (forwardX * e.movementX + forwardZ * e.movementY) * panSpeed;
            }
        });

        window.addEventListener('wheel', (e) => {
            // Zooming
            this.distance = Math.max(50, Math.min(5000, this.distance + e.deltaY));
        }, { passive: false });
    }

    // Update the camera's position and orientation based on user input
    update() {
        const lerp = 0.15;
        // Interpolate values
        this.currentRotation.x += (this.rotation.x - this.currentRotation.x) * lerp;
        this.currentRotation.y += (this.rotation.y - this.currentRotation.y) * lerp;
        this.currentDistance += (this.distance - this.currentDistance) * lerp;
        vec3.lerp(this.currentTarget, this.currentTarget, this.target, lerp);

        // Cap camera always above ground level
        let nextEyeY = this.currentTarget[1] + this.currentDistance * Math.sin(this.currentRotation.y);
        const minHeight = 10;
        if (nextEyeY < minHeight) {
            nextEyeY = minHeight;
        }

        // Update eye based on smoothed values
        this.eye[0] = this.currentTarget[0] + this.currentDistance * Math.sin(this.currentRotation.x) * Math.cos(this.currentRotation.y);
        this.eye[1] = this.currentTarget[1] + this.currentDistance * Math.sin(this.currentRotation.y);
        this.eye[2] = this.currentTarget[2] + this.currentDistance * Math.cos(this.currentRotation.x) * Math.cos(this.currentRotation.y);
    }
    // Calculate and return the view matrix for the current camera position and orientation
    getViewMatrix() {
        const viewMatrix = mat4.create();
        mat4.lookAt(viewMatrix, this.eye, this.currentTarget, [0, 1, 0]);
        return viewMatrix;
    }
}
