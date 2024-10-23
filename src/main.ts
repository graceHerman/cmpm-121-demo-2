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
canvas.width = 256;     // width = 256
canvas.height = 256;        // length = 256
app.appendChild(canvas);

// Create buttons and add it to container
// Create a container for the buttons
const buttonContainer = document.createElement('div');
buttonContainer.classList.add('button-container');

// Create thin and thick brush buttons
const thinButton = document.createElement('button');
thinButton.textContent = "Thin Brush";
const thickButton = document.createElement('button');
thickButton.textContent = "Thick Brush";

// Create clear, undo, redo, and export buttons
const clearButton = document.createElement('button');
clearButton.textContent = "Clear";
const undoButton = document.createElement('button');
undoButton.textContent = "Undo";
const redoButton = document.createElement('button');
redoButton.textContent = "Redo";

// Create a button for creating a custom sticker
const customStickerButton = document.createElement('button');
customStickerButton.textContent = "Add Custom Sticker";

// Create a color picker
const colorPicker = document.createElement('input');
colorPicker.type = 'color';
colorPicker.value = '#000000'; // Default color

// Define the initial set of stickers
// we're gonna use cat, star and melting emojis 
const stickersData: string[] = ["🐱", "🌟", "🫠"];
let selectedEmoji = "";     // make it empty string
// makes toolPreview initialized to null
// If it's later set, it will be an object with a 'draw' method used to draw on the canvas
let toolPreview: { draw: (ctx: CanvasRenderingContext2D) => void } | null = null;
let selectedColor = colorPicker.value; // Initialize with the color picker value
let selectedRotation = 0; // Initialize rotation

// Create dynamic sticker buttons based on stickersData
function createStickerButtons() {
    // Clear existing buttons first
    const existingButtons = document.querySelectorAll('.sticker-button');
    existingButtons.forEach(button => button.remove());     // removes each button

    // Create buttons for each emoji sticker
    stickersData.forEach(emoji => {
        const emojiButton = document.createElement('button');
        emojiButton.textContent = emoji;    // sets the new emoji button's text to the current emoji 
        emojiButton.classList.add('sticker-button');        // class for styling buttons
        emojiButton.addEventListener("click", () => {
            selectedEmoji = emoji;      // sets it to clicked emoji 
            selectedRotation = randomRotation(); // Randomize rotation
            toolPreview = null; // Clear the tool preview
        });
        buttonContainer.appendChild(emojiButton);
    });
}

// Append buttons and color picker to the container
buttonContainer.append(thinButton, thickButton, clearButton, undoButton, redoButton, customStickerButton, colorPicker);
app.appendChild(buttonContainer);

// Get the 2D drawing context
const context = canvas.getContext("2d")!;

// error handling for if context is not true
if (!context) {
    throw new Error("Failed to get canvas context");
}

// Store lines and tool preview
const lines: any[] = [];        // emprt array to store lines drawn
let currentLine: MarkerLine | null = null;      // initialized to null, stores the current line drawn
let redoStack: any[] = [];      // empty array to store drawn lines for redo button
let isDrawing = false;      // to track if the user is drawing on canvas, initialized it to false (not drawing)
let selectedThickness = 1;      // Makes the initial thickness of line 

// Event listener for placing stickers and drawing lines 
canvas.addEventListener("mousedown", (e) => {
    // if user selected an emoji sticker, create a new sticker at mouse position with emoji, rotation and color
    if (selectedEmoji) {
        currentLine = new StickerCommand(e.offsetX, e.offsetY, selectedEmoji, selectedRotation, selectedColor);
    } 
    
    // If user didn't select emoji sticker (possibly using marker tool), create a line at mouse position with the thickness and color
    else {
        currentLine = new MarkerLine(e.offsetX, e.offsetY, selectedThickness, selectedColor);
    }
    lines.push(currentLine);    // Push line drawns and emojis into array lines
    isDrawing = true;       // User is drawing
});

// Event listener for moving mouse positions
canvas.addEventListener("mousemove", (e) => {
    // If the user is drawing and there's an active line,
    // Update current line with new mouse position
    // And dispatch event indicating that the drawing has changed
    if (isDrawing && currentLine) {
        currentLine.drag(e.offsetX, e.offsetY);
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    } 
    
    // If the user is neither drawing and/or there's no active line,
    // create tool previews:
    // If the sticker was selected, create a sticker preview
    // If not, create a marker preview instead
    // Then dispatch an event for when the tool has moved
    else {
        toolPreview = selectedEmoji
            ? new StickerPreview(e.offsetX, e.offsetY, selectedEmoji, selectedRotation)
            : new MarkerToolPreview(e.offsetX, e.offsetY, selectedThickness, selectedColor);
        canvas.dispatchEvent(new CustomEvent("tool-moved"));
    }
});

// Event listener for when user releases the mouse (stops drawing)
window.addEventListener("mouseup", () => {
    if (isDrawing && currentLine) {
        isDrawing = false;
        currentLine = null;
    }
});

// Event listener for when the drawing changes 
// redraws the entire canvas
canvas.addEventListener("drawing-changed", () => {
    redrawCanvas();
});

// Event listener for when the tool moves
canvas.addEventListener("tool-moved", () => {
    redrawCanvas();

    // If there's an active tool preview, draw the tool preview
    if (toolPreview && 'draw' in toolPreview) {
        toolPreview.draw(context);
    }
});

// Redraw all lines on the canvas
function redrawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);       // Clears canvas
    lines.forEach(line => line.display(context));       // Display each line
}

// Clear the canvas and reset all lines when the clear button is clicked
clearButton.addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height); 
    lines.length = 0;       // Resets (empties) the array of lines
    redoStack.length = 0;       // Clear the redo stack
    canvas.dispatchEvent(new CustomEvent("drawing-changed"));
});

// Undo button functionality
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();       // Remove the last line
        if (lastLine) {
            redoStack.push(lastLine);       // Add the removed line to the redo stack
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed")); 
    }
});

// Redo button functionality
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const restoredLine = redoStack.pop();       // Take the last item from the redo stack
        if (restoredLine) {
            lines.push(restoredLine);       // Restore the line by pushing it back into the array
        }
        canvas.dispatchEvent(new CustomEvent("drawing-changed"));
    }
});

// Export functionality
const exportButton = document.createElement('button');
exportButton.textContent = "Export as PNG";
buttonContainer.appendChild(exportButton);

// Event listener for export button
exportButton.addEventListener("click", () => {
    // Create a new canvas and context for exporting
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportContext = exportCanvas.getContext("2d")!;

    // Error handling if exportContext is not true
    if (!exportContext) {
        throw new Error("Failed to get export canvas context");
    }

    // Scale the context for the larger canvas (4x in both dimensions)
    exportContext.scale(4, 4);

    // Redraw all existing lines on the new canvas
    lines.forEach(line => line.display(exportContext));

    // File download
    const link = document.createElement('a');       // Creates link for downloading image
    link.href = exportCanvas.toDataURL("image/png");        // Canvas URL
    link.download = "drawing.png";      // Name for the downloaded file
    link.click();       // Programmatically click the link to trigger download
});

// Utility functions
// Generates random color
function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';

    // Randomly selects six digits from letters to turn into color
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Generates a random rotation for stickers between degrees 0 to 360 
function randomRotation() {
    return Math.floor(Math.random() * 360);
}

// Marker and Sticker tool classes

// Marker tool: Class for drawn lines with marker thickness and color 
class MarkerLine {
    points: Array<{ x: number, y: number }>;        // Array to store points on line     
    thickness: number;      // Line thickness
    color: string;      // Line color 

    // Initializes line with first point, thickness and color 
    constructor(initialX: number, initialY: number, thickness: number, color: string) {
        this.points = [{ x: initialX, y: initialY }];
        this.thickness = thickness;
        this.color = color;
    }

    // Adds new points to the line when the mouse is dragged 
    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    // Display line on canvas
    display(ctx: CanvasRenderingContext2D) {
        if (this.points.length > 1) {
            ctx.lineWidth = this.thickness;
            ctx.strokeStyle = this.color; // Use the selected color
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

// Sticker tool: Class for sticker emoji 
class StickerCommand {
    x: number;      // X-coordinate for sticker placement
    y: number;      // Y-coordinate for sticker placement 
    emoji: string;      //  emoji string for sticker
    rotation: number;       // sticker rotation
    color: string;      //  sticker color

    // Initializes the emoji placement, the rotation and color of sticker 
    constructor(x: number, y: number, emoji: string, rotation: number, color: string) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
        this.color = color;
    }

    // Displays the stciker on canvas 
    display(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180); // Convert degrees to radians
        ctx.fillStyle = this.color;
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

// Marker tool preview: Class for preview of thin marker and thick marker lines (dimensions and extensions)
class MarkerToolPreview {
    x: number;      // X-coordinate for preview
    y: number;      // Y-coordinate for preview
    thickness: number;      // Thickness for preview 
    color: string;      // Color for preview

    // Initializes the marker line/preview's positions, thickness and color
    constructor(x: number, y: number, thickness: number, color: string) {
        this.x = x;
        this.y = y;
        this.thickness = thickness;
        this.color = color;
    }

    // Draws the preview of the marker tool on canvas 
    draw(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = this.thickness;
        ctx.strokeStyle = this.color; 
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + 10, this.y + 10); // Simple line preview
        ctx.stroke();
        ctx.closePath();
    }
}

// Sticker preview: Class for preview of emoji stickers (dimension and extensions)
class StickerPreview {
    x: number;      // X-coordinate for preview
    y: number;      // Y-coordinate for preview
    emoji: string;      // emoji for preview 
    rotation: number;       // Rotation for preview

    // Inistailizes the preview's positions, emoji and rotation
    constructor(x: number, y: number, emoji: string, rotation: number) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.rotation = rotation;
    }

    // Draws the preview of stickers on canvas 
    draw(ctx: CanvasRenderingContext2D) {
        ctx.save(); 
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.emoji, 0, 0);
        ctx.restore();
    }
}

// Tool selection: thin marker, thick marker, and sticker buttons 

// Event listener for thickness and color of thin brush button
thinButton.addEventListener("click", () => {
    selectedThickness = 1;
    selectedColor = colorPicker.value; // selected color
    selectedRotation = randomRotation(); // Randomize rotation
    selectedEmoji = "";
    toolPreview = null;
});

// Event listener for thickness and color of thick brush button
thickButton.addEventListener("click", () => {
    selectedThickness = 5;
    selectedColor = colorPicker.value; // selected color
    selectedRotation = randomRotation(); // Randomize rotation
    selectedEmoji = "";
    toolPreview = null;
});

// When user wants to use custom sticker, prompt user to enetr new emoji 
customStickerButton.addEventListener("click", () => {
    const newSticker = prompt("Enter a new sticker emoji:", "✨");

    // If newSticker is true, add new sticker to the data array and recreate the sticker buttons to the new emojis
    if (newSticker) {
        stickersData.push(newSticker); 
        createStickerButtons();
    }
});

// Initialize sticker buttons
createStickerButtons();


// File Path: '/Users/gracelilanhermangmail.com/Desktop/Fall 2024/121/cmpm-121-demo-2'