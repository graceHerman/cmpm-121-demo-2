import "./style.css";

const APP_NAME = "DENO draws";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// My edits
// Make an app title
const title = document.createElement('h1');
title.textContent = APP_NAME;
app.appendChild(title);

// Make a canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;

app.appendChild(canvas);

// Make clear buttton to clear drawing
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";

app.appendChild(clearButton);

// Make it so that person can draw
// Get the 2D drawing context
const context = canvas.getContext("2d")!;
if (context === null) {
    throw new Error("Failed to get 2D context for the canvas.");
}

// Store lines (array of arrays of points)
const lines: Array<Array<{ x: number, y: number }>> = [];
let currentLine: Array<{ x: number, y: number }> = [];
let isDrawing = false;
let x = 0;
let y = 0;

// Add the event listeners for mouse events
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
    currentLine = []; // Create a new line
    lines.push(currentLine); // Add it to the lines array
    addPoint(x, y); // Add the starting point
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        addPoint(e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

window.addEventListener("mouseup", () => {
    if (isDrawing) {
        addPoint(x, y); // Ensure the last point is saved
        isDrawing = false;
    }
});

// Add a point to the current line and dispatch "drawing-changed" event
function addPoint(x: number, y: number) {
    currentLine.push({ x, y });
    const event = new CustomEvent("drawing-changed");
    canvas.dispatchEvent(event);
}

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Redraw all lines on the canvas
function redrawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

    // Redraw each line
    lines.forEach((line) => {
        if (line.length > 1) {
            context.beginPath();
            for (let i = 0; i < line.length - 1; i++) {
                const startPoint = line[i];
                const endPoint = line[i + 1];
                drawLine(context, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
            }
            context.stroke();
            context.closePath();
        }
    });
}

// Draw a line between two points
function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
}

// Clear the canvas and reset all lines when the clear button is clicked
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    lines.length = 0; // Reset the array of lines
});
// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'
