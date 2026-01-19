// Install the required packages: express, image-js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Image } = require('image-js');

const app = express();
const PORT = 3000;

// ==========================================
// CONFIGURATION
// ==========================================
// Change this value to alter the speed (in milliseconds)
const UPDATE_INTERVAL_MS = 120000; 
// ==========================================

// Serve static files (e.g., CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Load and cache the image in memory to preserve changes between intervals
let cachedImage = null;
let cachedReplaceImage = null;

const imagePath = path.join(__dirname, 'public', 'images', 'example.jpg');
const outputPath = path.join(__dirname, 'public', 'images', 'edited-example.jpg');
const replacePath = path.join(__dirname, 'public', 'images', 'replace.jpg');

async function loadImage() {
  if (!cachedImage) {
    // FIX: Check if the output file already exists. 
    // If yes, load it to resume progress. If no, load the original.
    if (fs.existsSync(outputPath)) {
      console.log('Found existing progress. Resuming...');
      cachedImage = await Image.load(outputPath);
    } else {
      console.log('No progress found. Starting fresh...');
      cachedImage = await Image.load(imagePath);
    }
  }
  return cachedImage;
}

async function loadReplaceImage() {
  if (!cachedReplaceImage) {
    cachedReplaceImage = await Image.load(replacePath);
  }
  return cachedReplaceImage;
}

// Function to replace a random pixel
async function turnRandomPixelBlack() {
  try {
    // Load the image from memory
    const image = await loadImage();
    const replace = await loadReplaceImage();

    // Get the image dimensions
    const { width, height } = image;

    let pixelChanged = false;
    let attempts = 0;
    const maxAttempts = 1000; // Safety break to prevent infinite loops

    while (!pixelChanged && attempts < maxAttempts) {
      // Pick a random pixel
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Get the color of the pixel
      const pixel = image.getPixelXY(x, y);
      const replacePixel = replace.getPixelXY(x, y);

      // Check if the pixel is NOT already the target color
      if (!(pixel[0] === replacePixel[0] && pixel[1] === replacePixel[1] && pixel[2] === replacePixel[2])) {
        // Change the pixel
        image.setPixelXY(x, y, [replacePixel[0], replacePixel[1], replacePixel[2], pixel[3] || 255]); // Preserve alpha channel
        pixelChanged = true;
      }
      
      attempts++;
    }

    if (pixelChanged) {
        // Save the modified image
        await image.save(outputPath);
        console.log('Pixel updated.');
    } else {
        console.log('Image likely complete (or could not find a pixel to change in 1000 attempts).');
    }

  } catch (error) {
    console.error('Error coloring pixel: ', error);
  }
}

// Start the interval using the variable defined at the top
setInterval(() => {
  turnRandomPixelBlack();
}, UPDATE_INTERVAL_MS);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});