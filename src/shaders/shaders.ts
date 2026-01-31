// Vertex Shader
// This shader transforms vertex positions and assigns colors based on depth
// Runs on each vertex
export const vsSource = `
    attribute vec3 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
        gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aVertexPosition, 1.0);
        
        // Basic "Depth" coloring: closer parts are brighter
        float colorVal = (gl_Position.z / gl_Position.w) * 0.5 + 0.5;
        vColor = vec4(0.0, colorVal, 1.0, 1.0); 
    }
`;

// Fragment Shader
// Sets the fragment color based on interpolated vertex color
// Runs on each pixel of the rendered shape
export const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
        gl_FragColor = vColor;
    }
`;
