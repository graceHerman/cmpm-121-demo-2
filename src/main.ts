import "./style.css";

const APP_NAME = "DENO draws";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;
app.innerHTML = APP_NAME;

// Make an app title
const title = document.createElement('h1');
title.textContent = APP_NAME;
app.appendChild(title);

// Make a canvas
const canvas = document.createElement('canvas');
canvas.width = 256;
canvas.height = 256;

app.appendChild(canvas);

// Create a container for the buttons
const buttonContainer = document.createElement('div');
buttonContainer.classList.add('button-container');

// Create clear, undo, redo buttons
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";

const undoButton = document.createElement('button');
undoButton.textContent = "Undo";

const redoButton = document.createElement('button');
redoButton.textContent = "Redo";

// Create marker tool buttons (Thin, Thick)
const thinButton = document.createElement('button');
thinButton.textContent = "Thin Marker";

const thickButton = document.createElement('button');
thickButton.textContent = "Thick Marker";

// Append buttons to the container
buttonContainer.appendChild(clearButton);
buttonContainer.appendChild(undoButton);
buttonContainer.appendChild(redoButton);
buttonContainer.appendChild(thinButton);
buttonContainer.appendChild(thickButton);

// Add the button container to the app
app.appendChild(buttonContainer);

// Get the 2D drawing context
const context = canvas.getContext("2d")!;
if (!context) {
    throw new Error("Failed to get canvas context");
}

// Marker tool state (default to thin)
let markerThickness = 1;
let toolPreview: ToolPreview | null = null;  // To track the tool preview

// Set the selected tool with visual feedback
function selectTool(button: HTMLButtonElement, thickness: number) {
    thinButton.classList.remove('selectedTool');
    thickButton.classList.remove('selectedTool');
    
    button.classList.add('selectedTool');
    markerThickness = thickness;
}

// Event listeners for tool buttons
thinButton.addEventListener('click', () => selectTool(thinButton, 1));
thickButton.addEventListener('click', () => selectTool(thickButton, 5));

// Default tool is thin
selectTool(thinButton, 1);

// Store lines (array of MarkerLine objects) and a redo stack
const lines: MarkerLine[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: MarkerLine[] = [];
let isDrawing = false;

// Add the event listeners for mouse events
canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    currentLine = new MarkerLine(e.offsetX, e.offsetY, markerThickness);
    lines.push(currentLine);
    toolPreview = null;  // Hide the preview while drawing
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    } else {
        // Update tool preview while not drawing
        toolPreview = new ToolPreview(e.offsetX, e.offsetY, markerThickness);
        canvas.dispatchEvent(new CustomEvent("tool-moved"));
    }
});

window.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        currentLine = null;
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

// Observer for "drawing-changed" event to redraw the canvas
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Observer for "tool-moved" event to redraw the canvas including the tool preview
canvas.addEventListener("tool-moved", () => {
    redrawCanvas();
});

// Redraw all lines and the tool preview on the canvas
function redrawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    lines.forEach(line => line.display(context));  // Display each line
    
    if (!isDrawing && toolPreview) {
        toolPreview.draw(context);  // Draw tool preview only when not drawing
    }
}

// Clear the canvas and reset all lines when the clear button is clicked
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    lines.length = 0;  // Reset the array of lines
    redoStack.length = 0;  // Clear the redo stack
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));  // Trigger redraw
});

// Undo functionality
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();  // Remove the last line
        if (lastLine) {
            redoStack.push(lastLine);  // Add the removed line to the redo stack
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));  // Trigger redraw
    }
});

// Redo functionality
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const restoredLine = redoStack.pop();  // Take the last item from the redo stack
        if (restoredLine) {
            lines.push(restoredLine);  // Restore the line
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));  // Trigger redraw
    }
});

// Class that represents marker lines, with a configurable thickness
class MarkerLine {
    points: Array<{ x: number, y: number }>;
    thickness: number;

    constructor(initialX: number, initialY: number, thickness: number) {
        this.points = [{ x: initialX, y: initialY }];
        this.thickness = thickness;
    }

    // Add a new point as the user drags the mouse
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    // Display the line on the canvas context with the appropriate thickness
    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            ctx.beginPath();
            ctx.lineWidth = this.thickness;  // Set the line thickness
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// Class for the tool preview
class ToolPreview {
    x: number;
    y: number;
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    // Draw a circle at the current mouse position representing the tool size
    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.lineWidth = 1;  // Draw the preview with a thin line
        ctx.strokeStyle = "gray";  // Use a gray color for the preview
        ctx.stroke();
        ctx.closePath();
    }
}

// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'