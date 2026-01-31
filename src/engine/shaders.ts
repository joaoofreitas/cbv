
export namespace Shaders {
    // Initializes a shader program from vertex and fragment shader source code
    //
    // @param gl - WebGLRenderingContext - The WebGL rendering context
    // @param vertexSource - string - The source code of the vertex shader
    // @param fragmentSource - string - The source code of the fragment shader
    //
    // @returns WebGLProgram | null - The initialized shader program or null if initialization failed
    export function InitShader(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
        const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

        const shaderProgram = gl.createProgram();
        if (shaderProgram === null || vertexShader === null || fragmentShader === null) {
            console.log("Failed to create shader program or load shaders");
            return null;
        }
        // Attach the shaders to the program
        gl.attachShader(shaderProgram, vertexShader);
        gl.attachShader(shaderProgram, fragmentShader);
        gl.linkProgram(shaderProgram);

        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
            return null;
        }
        return shaderProgram;
    }

    // Loads and Compiles a shader from source code
    // 
    // @param gl - WebGLRenderingContext - The WebGL rendering context
    // @param type - number - The type of shader (VERTEX_SHADER or FRAGMENT_SHADER)
    // @param source - string - The source code of the shader
    // 
    // @returns WebGLShader | null - The compiled shader or null if compilation failed
    function loadShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
        console.log("Loading shader of type:", type);

        const shader = gl.createShader(type)
        if (shader === null) {
            return shader;
        }

        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
}
