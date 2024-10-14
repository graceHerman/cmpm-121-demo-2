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
const context = canvas.getContext("2d");
if (!context) {
    throw new Error("Failed to get canvas context");
}

// Variables to track drawing state
let isDrawing = false;
let x = 0;
let y = 0;

// Add the event listeners for mouse events
canvas.addEventListener("mousedown", (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing) {
        drawLine(context, x, y, e.offsetX, e.offsetY);
        x = e.offsetX;
        y = e.offsetY;
    }
});

window.addEventListener("mouseup", () => {
    if (isDrawing) {
        drawLine(context, x, y, x, y); // Draw the last segment
        isDrawing = false;
    }
});

function drawLine(context: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    context.beginPath();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    context.closePath();
}

// Clear the canvas when the clear button is clicked
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
});

// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'
