// Vertex Shader
export const vsSource = `
    attribute vec3 aVertexPosition;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying vec3 vPosition;

    void main(void) {
        vec4 pos = uModelViewMatrix * vec4(aVertexPosition, 1.0);
        vPosition = pos.xyz;
        gl_Position = uProjectionMatrix * pos;
    }
`;

// Fragment Shader
export const fsSource = `
    #extension GL_OES_standard_derivatives : enable
    precision lowp float;

    varying vec3 vPosition;

    void main(void) {
        // Calculate the normal of the face automatically
        vec3 fdx = dFdx(vPosition);
        vec3 fdy = dFdy(vPosition);
        vec3 normal = normalize(cross(fdx, fdy));

        // Define a "Sun" direction (coming from top-right)
        vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
        
        // Calculate how much light hits this face (0.0 to 1.0)
        float dotProduct = dot(normal, lightDir);
        float brightness = max(dotProduct, 0.3); // 0.3 is ambient light so it's not pitch black

        vec3 baseColor = vec3(0.9, 0.9, 0.95);
        gl_FragColor = vec4(baseColor * brightness, 1.0);
    }
`;
