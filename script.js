const canvas = document.getElementById("canvas1")
console.log(canvas)
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

//gets called everytime we resize, this is to prevent the drawings scaling with the size of the canvas
window.addEventListener("resize",() => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    drawings()
})

//gets called once when we run the code
drawings()

//all of the things we want to draw go here
function drawings() {
    ctx.fillStyle = "white";
    ctx.fillRect(10,20,150,50);
    
}

//how to make fluid simulator
//1. information will be stored in a grid, the grid will contain information for the fluid in each block (things like velocity, density)
//2. the grid will be deteministic, which is to say that we will use the previous state of the grid to calculate the next state of the grid, and repeat this process
//3. to simulate pressure, we need to create a diffusion of the density of a grid. This is done by defining a variable (cgrid_density) to contain the density value 
//   of a grid, next we will calculate the value of the average density of the neigbouring squares (cgrid_friendavg_density) Lastly we will define a value k that
//   contains a value representing how much we are changing the value (timestep/deltatime)
//4. 