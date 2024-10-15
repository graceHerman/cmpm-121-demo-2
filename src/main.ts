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

// Make clear button
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
app.appendChild(clearButton);

// Make undo button
const undoButton = document.createElement('button');
undoButton.textContent = "Undo";
app.appendChild(undoButton);

// Make redo button
const redoButton = document.createElement('button');
redoButton.textContent = "Redo";
app.appendChild(redoButton);

// Get the 2D drawing context
const context = canvas.getContext("2d")!;
if (context === null) {
    throw new Error("Failed to get canvas context");
}

// Store lines (array of arrays of points) and a redo stack
const lines: Array<Array<{ x: number, y: number }>> = [];
let currentLine: Array<{ x: number, y: number }> = [];
let redoStack: Array<Array<{ x: number, y: number }>> = [];
let isDrawing = false;
let x = 0;
let y = 0;

// Add the event listeners for mouse events
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    x = e.offsetX;
    y = e.offsetY;
    currentLine = [];
    lines.push(currentLine);  // Start a new line
    addPoint(x, y);
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
    redoStack.length = 0; // Clear the redo stack
    canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
});

// Undo button fundtion
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop(); // Remove the last line
        if (lastLine) {
            redoStack.push(lastLine); // Add the removed line to the redo stack
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
    }
});

// Redo button function
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const restoredLine = redoStack.pop(); // Take the last item from the redo stack
        if (restoredLine) {
            lines.push(restoredLine); // Restore the line
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
    }
});

// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'
