const canvas = document.getElementById("canvas1")
const gl = canvas.getContext("webgl2");

let output_scale = 1; 
canvas.width = canvas.clientWidth * output_scale;
canvas.height = canvas.clientHeight * output_scale;

addEventListener("mousemove", (event) => {})

function main() {
    var vertexShaderSource = `#version 300 es 
    //preparing the variables that will be sendt to the GPU,
    //variables that will be inside the GPU
    //these will be interactable/preparable from the CPU/javascript, then sendt to the GPU. But they need to be defined as we are doing here
    in vec2 a_position;
    out vec4 v_color;
    uniform vec2 u_resolution;

    void main() {
        //converts the position from pixels to 0.0 to 1.0, then to 0.0 to 2.0, then to -1.0 to 1.0
        vec2 clipSpace = ((a_position / u_resolution) * 2.0) - 1.0;
        gl_Position = vec4(clipSpace, 0, 1);
        v_color = gl_Position * 0.5 + 0.5;
    }
    `;

    var fragmentShaderSource = `#version 300 es
    //fragment shaders do not have a default value, so we use highp because its good
    precision highp float;
    in vec4 v_color;
    out vec4 outColor;
    uniform int whiteColor;

    void main() {
        if (whiteColor == 1) {
            outColor = vec4(1.0,1.0,1.0,1.0);
        }
        else {
            outColor = v_color;
        }
    }
    `;

    function createShader(gl,type,source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        //seems it gets the status of the creation of a shader, and if it worked, returns the created shader
        var success = gl.getShaderParameter(shader,gl.COMPILE_STATUS);
        if (success) {
            return shader
        }
    
        //of course, if the code is not returned, it will continue here and deletee the shader after logging it to console
        console.log("error mfs",gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }

    function createProgram(gl, vertexShader, fragmentShader) {
        var program = gl.createProgram();
        gl.attachShader(program,vertexShader);
        gl.attachShader(program,fragmentShader);
        gl.linkProgram(program);
        var success = gl.getProgramParameter(program,gl.LINK_STATUS);
        if (success) {
            return program;
        }
        
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    var program = createProgram(gl,vertexShader, fragmentShader);

    //finding the position of the a_position attribute we've made in the GPU
    //this step should be done during initalization, since this is only neccessary once.
    //in our case we only need to find one attribute position, since we only have one attribute
    //prepared at the GPUs end
    var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    var resolutionUniformLocation = gl.getUniformLocation(program,"u_resolution");
    const whiteColorLocation = gl.getUniformLocation(program,"whiteColor");
    if (whiteColorLocation !== null) {
        console.log("whitecolorlocation did not get")
    }

    //next to send update the variable, we need to use a buffer, as attributes get their data from buffers
    var positionBuffer = gl.createBuffer();

    //here we bind the buffer to the positionBuffer this is connecting the value of the positionBuffer javascript variable to the ARRAY_BUFFER, idk what that is yet tho
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    //next lets make 3 2d points

    //the position are written in webgl viewport, that is to say that 0 is really -1, and 100vw is 1

    //here we are making a collection of attribute state, also known as vertex array
    var vao = gl.createVertexArray();

    //sets the currently read vertexarray to vao
    gl.bindVertexArray(vao);
    //enables positionAttributeLocation so that webgl knows to pull data out of it. If it was not enabled, it would have a constant value, (test this out cuz idk what that means)
    gl.enableVertexAttribArray(positionAttributeLocation);

    var size = 2;           //2 components per iteration
    var type = gl.FLOAT;    //specifies that the data is 32bit floats
    var normalize = false;  //turns normalization on or off (normalize the data or not)
    var stride = 0;         //0 = move forward sizeof(type) each iteration to get the position of the next data (gotta think in the stack yo)
    var offset = 0;         //starts at the beginning of the buffer

    //doing this will also bind the currently bound ARRAY_BUFFER to the positionBuffer, meaning that ARRAY_BUFFER is free to be bound to something else while the
    //attribute that was bound will continue to be bound to the positionBuffer
    gl.vertexAttribPointer(positionAttributeLocation,size,type,normalize,stride,offset)

    //webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    //set the viewport of gl, converting the canvas width and height to values between -1 and 1
    gl.viewport(0,0,gl.canvas.width, gl.canvas.height);

    //here we clear the screen
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //here we tell webgl to use the shader program we made
    gl.useProgram(program)
    
    let whiteBackground = false;
    let lastMouseX = window.innerWidth/2;
    let lastMouseY = window.innerHeight/2;
    onkeydown = (e) => {
        if (e.key == "f") {
            whiteBackground = !whiteBackground;
            drawEffect(lastMouseX,lastMouseY)
        }
    }

    let startAngle = 0;    
    gl.uniform2f(resolutionUniformLocation,gl.canvas.width,gl.canvas.height)
    function drawEffect(mousex,mousey) {
        startAngle += 0.1;
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.uniform1i(whiteColorLocation,+!whiteBackground)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0,canvas.height,canvas.width,canvas.height,canvas.width,canvas.height,canvas.width,0,0,0]),gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES,0,6);    
        gl.uniform1i(whiteColorLocation,+whiteBackground)
        
        //pass in the canvas resolution
        shapeList = shapeGen(mousex,mousey,64,75,startAngle)

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shapeList),gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES,0,shapeList.length/2);
    }
    onmousemove = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = (canvas.height-e.clientY);
        drawEffect(lastMouseX,lastMouseY)
    }
    drawEffect(lastMouseX,lastMouseY)
}

main();

function shapeGen(x,y,segments,radius,angle) {
    let list = [];

    let xpos_start = x;
    let ypos_start = y;

    for(let n = 0; n < segments;n++) {
        list.push(xpos_start)  //x1
        list.push(ypos_start)  //y1
        
        for(let i = 0; i < 2; i++) {
            let arguement = (angle/segments)+(((2*Math.PI)/segments)*(i+n-1))   //this is a math equation that when used as i have, lets you generate N-cornered shapes
            let xpos = radius*Math.cos(arguement)+xpos_start;
            let ypos = radius*Math.sin(arguement)+ypos_start;
            list.push(xpos) //x2 and x3
            list.push(ypos) //y2 and y3
        }
    }
    return list
}

function makeTriangle(pos1,pos2,pos3) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        pos1[0],pos1[1],
        pos2[0],pos2[1],
        pos3[0],pos3[1],
    ]),gl.STATIC_DRAW);
}

function makeRectangle(x,y,width,height) {
    let x1 = x;
    let x2 = x+width;
    let y1 = y;
    let y2 = y+height;

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        x1,y1,
        x2,y1,
        x1,y2,
        x1,y2,
        x2,y1,
        x2,y2
    ]),gl.STATIC_DRAW);
}