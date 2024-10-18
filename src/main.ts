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

// Create tool and sticker buttons
const thinButton = document.createElement('button');
thinButton.textContent = "Thin Marker";
const thickButton = document.createElement('button');
thickButton.textContent = "Thick Marker";

// Sticker data defined in JSON-like structure
const stickersData = [
    { emoji: "🐱" },
    { emoji: "🌟" },
    { emoji: "🫠" }
];

// Create buttons for predefined stickers
const stickerButtons: HTMLButtonElement[] = stickersData.map(sticker => {
    const button = document.createElement('button');
    button.textContent = sticker.emoji;
    button.addEventListener('click', () => {
        selectedEmoji = sticker.emoji;
        toolPreview = null;
    });
    return button;
});

// Create clear, undo, and redo buttons
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
const undoButton = document.createElement('button');
undoButton.textContent = "Undo";
const redoButton = document.createElement('button');
redoButton.textContent = "Redo";

// Add button for creating custom sticker
const customStickerButton = document.createElement('button');
customStickerButton.textContent = "Add Custom Sticker";
customStickerButton.addEventListener('click', () => {
    const newSticker = prompt("Custom sticker text:", "✨");
    if (newSticker) {
        stickersData.push({ emoji: newSticker }); // Add new sticker to the array
        const newButton = document.createElement('button');
        newButton.textContent = newSticker;
        newButton.addEventListener('click', () => {
            selectedEmoji = newSticker;
            toolPreview = null;
        });
        buttonContainer.appendChild(newButton); // Add the new button to the container
    }
});

// Append buttons to the container
buttonContainer.append(thinButton, thickButton, ...stickerButtons, clearButton, undoButton, redoButton, customStickerButton);
app.appendChild(buttonContainer);

// Get the 2D drawing context
const context = canvas.getContext("2d")!;
if (!context) {
    throw new Error("Failed to get canvas context");
}

// Store lines and tool preview
const lines: any[] = [];
let currentLine: MarkerLine | null = null;
let redoStack: any[] = [];
let toolPreview: { draw: (ctx: CanvasRenderingContext2D) => void } | null = null;
let isDrawing = false;
let selectedThickness = 1;
let selectedEmoji = "";

// Add the event listeners for mouse events
canvas.addEventListener("mousedown", (e) => {
    if (selectedEmoji) {
        // User selected a sticker
        currentLine = new StickerCommand(e.offsetX, e.offsetY, selectedEmoji);
    } else {
        // Marker tool selected
        currentLine = new MarkerLine(e.offsetX, e.offsetY, selectedThickness);
    }
    lines.push(currentLine);
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    } else {
        // Handle the tool preview
        toolPreview = selectedEmoji
            ? new StickerPreview(e.offsetX, e.offsetY, selectedEmoji)
            : new MarkerToolPreview(e.offsetX, e.offsetY, selectedThickness);
        canvas.dispatchEvent(new CustomEvent("tool-moved"));
    }
});

window.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        currentLine = null;
    }
});

// Redraw canvas when drawing changes
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Redraw tool preview when the mouse moves
canvas.addEventListener("tool-moved", () => {
    redrawCanvas();
    if (toolPreview && 'draw' in toolPreview) {
        toolPreview.draw(context);
    }
});

// Redraw all lines on the canvas
function redrawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    lines.forEach(line => line.display(context)); // Display each line
}

// Clear the canvas and reset all lines when the clear button is clicked
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    lines.length = 0; // Reset the array of lines
    redoStack.length = 0; // Clear the redo stack
    canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
});

// Undo functionality
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop(); // Remove the last line
        if (lastLine) {
            redoStack.push(lastLine); // Add the removed line to the redo stack
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
    }
});

// Redo functionality
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const restoredLine = redoStack.pop(); // Take the last item from the redo stack
        if (restoredLine) {
            lines.push(restoredLine); // Restore the line
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed")); // Trigger redraw
    }
});

// Marker and Sticker tool classes
class MarkerLine {
    points: Array<{ x: number, y: number }>;
    thickness: number;

    constructor(initialX: number, initialY: number, thickness: number) {
        this.points = [{ x: initialX, y: initialY }];
        this.thickness = thickness;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            ctx.lineWidth = this.thickness;
            ctx.beginPath();
            ctx.moveTo(this.points[0].x, this.points[0].y);
            for (let i = 1; i < this.points.length; i++) {
                ctx.lineTo(this.points[i].x, this.points[i].y);
            }
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// Sticker tool
class StickerCommand {
    x: number;
    y: number;
    emoji: string;

    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, this.x, this.y);
    }
}

// Tool preview classes
class MarkerToolPreview {
    x: number;
    y: number;
    thickness: number;

    constructor(x: number, y: number, thickness: number) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.thickness / 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }
}

class StickerPreview {
    x: number;
    y: number;
    emoji: string;

    constructor(x: number, y: number, emoji: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, this.x, this.y);
    }
}

// Tool selection logic
thinButton.addEventListener("click", () => {
    selectedThickness = 1;
    selectedEmoji = "";
    toolPreview = null;
});

thickButton.addEventListener("click", () => {
    selectedThickness = 10;
    selectedEmoji = "";
    toolPreview = null;
});


// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'