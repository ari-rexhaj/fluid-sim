const canvas = document.getElementById("canvas1")
const gl = canvas.getContext("webgl2");

let output_scale = 1; 
canvas.width = canvas.clientWidth * output_scale;
canvas.height = canvas.clientHeight * output_scale;

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
    
    let startAngle = 0;    
    let segments = 2;
    let radius = 0;
    
    let animPos_x = 0;
    let animPos_y = window.innerHeight/2;
    
    gl.uniform2f(resolutionUniformLocation,gl.canvas.width,gl.canvas.height)
    function drawEffect(mousex,mousey) {
        gl.clear(gl.COLOR_BUFFER_BIT)
        
        //drawing the background
        gl.uniform1i(whiteColorLocation,+!whiteBackground)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0,0,canvas.height,canvas.width,canvas.height,canvas.width,canvas.height,canvas.width,0,0,0]),gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES,0,6);    
        
        gl.uniform1i(whiteColorLocation,+whiteBackground)
        
        //pass in the canvas resolution
        shapeList = shapeGen(animPos_x,animPos_y,segments,radius,startAngle)
        
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(shapeList),gl.STATIC_DRAW)
        gl.drawArrays(gl.TRIANGLES,0,shapeList.length/2);
    }
    onkeydown = (e) => {
        if (e.key == "f") {
            whiteBackground = !whiteBackground;
        }
        if (e.key == "w") {
            radius += 3;
        }
        if (e.key == "s") {
            radius -= 3;
        }
        if (e.key == "a") {
            startAngle += 0.2;
        }
        if (e.key == "d") {
            startAngle -= 0.2;
        }
        if (e.key == "e") {
            segments += 1;
            console.log(segments)
        }
        if (e.key == "q") {
            if (segments > 3) {
                segments -= 1;
            }
            console.log(segments)
        }

    }
    onmousemove = (e) => {
        lastMouseX = e.clientX;
        lastMouseY = (canvas.height-e.clientY);
    }

    onmousedown = (e) => {
        if(tick > abt_anim_end && has_clicked) {
            second_click = true;
        }
        if(tick > 73) {
            has_clicked = true;
        }
        console.log(tick)
    }

    let second_click = false;
    let has_clicked = false;
    let tick = 0;
    let abt_anim_start = null;
    let abt_anim_end = 0;
    let final_anim_start = null;
    let final_anim_end = 0;

    function animate() {
        
        tick++;
        drawEffect(lastMouseX,lastMouseY)
        requestAnimationFrame(animate);
        
        if(radius < window.innerHeight/2) {
            radius = inverse_anim(tick/8)*window.innerHeight/1.8
            if(segments < 128 && tick%3 == 0) {
            segments += 2;
            }
        }
        //else {console.log(tick)} //debugging
        if(tick == 73) {
            whiteBackground = !whiteBackground;
        }
        if (tick == 74) {
            document.getElementById("justwork").style.visibility = "visible"
        }
        
        if(has_clicked) {
            if(abt_anim_start === null) {
                abt_anim_start = tick;
                abt_anim_end = tick+100;
            }
            else {
                if (tick < abt_anim_end) {
                    let lerp_tick = (tick-abt_anim_start)/100;
                    animPos_x = (((1-lerp(lerp_tick)))*(window.innerWidth-475));
                    segments = Math.floor(lerp(lerp_tick)*46+4)
                    startAngle = lerp(lerp_tick)+(Math.PI)
                    radius = 175*(1-lerp(lerp_tick))+window.innerHeight/2
                    
                }
                else {
                    document.getElementById("description").style.visibility = "visible"
                    document.getElementById("description").style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000"
                }
            }
        }
        if(second_click) {
            if(final_anim_start === null) {
                final_anim_start = tick;
                final_anim_end = tick+100;
            }
            else {
                if(tick < final_anim_end) {
                    let lerp_tick = (tick-final_anim_start)/100;

                    animPos_x = (((lerp(lerp_tick))*lastMouseX))+window.innerWidth-475
                }
                else{
                    animPos_x = lastMouseX
                }
            }
        }

    }
    animate()

    function inverse_anim(t) {
        return 1-1/(1+t);
    }

    function lerp(t) {
        return (Math.cos(Math.PI*t) + 1) / 2
    }
}

main();

function shapeGen(x,y,segments,radius,angle) {
    let list = [];
    //loop for each triangle, we need to give 3 points per triangle
    for(let n = 0; n < segments;n++) {
        //first point: the center of the shape, aka the specified x and y position
        list.push(x)  //x1
        list.push(y)  //y1
        
        //here we loop 2 times, this is for generating both the second and third point, 
        //since they are both calculated the same way but just with one being 1 "step" ahead of the next
        //on top of that we need to be able to use the 3rd point as the start of the next triangle, so
        //using this loop we can find the calculation for the next step without looping to the next step
        //in the outer loop.
        //                                                             |||
        //if you remove the "n" variable on the part under the arrows- vvv -you can see the generation of a single triangle in the whole shape
        for(let i = 0; i < 2; i++) {
            let arguement = (angle/segments)+(((2*Math.PI)/segments)*(i+n))   //this is a math equation that when used as i have, lets you generate N-cornered shapes
            let xpos = radius*Math.cos(arguement)+x;
            let ypos = radius*Math.sin(arguement)+y;
            list.push(xpos) //x2 and x3
            list.push(ypos) //y2 and y3
        }
    }
    return list
}

