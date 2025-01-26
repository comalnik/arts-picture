// Install the required packages: express, image-js
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Image } = require('image-js');

const app = express();
const PORT = 3000;

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
    cachedImage = await Image.load(imagePath);
  }
  return cachedImage;
}

async function loadReplaceImage() {
  if (!cachedReplaceImage) {
    cachedReplaceImage = await Image.load(replacePath);
  }
  return cachedReplaceImage;
}

// Function to turn a random pixel black
async function turnRandomPixelBlack() {
  try {
    // Load the image from memory
    const image = await loadImage();
    const replace = await loadReplaceImage();

    // Get the image dimensions
    const { width, height } = image;

    let pixelTurnedBlack = false;
    while (!pixelTurnedBlack) {
      // Pick a random pixel
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);

      // Get the color of the pixel
      const pixel = image.getPixelXY(x, y);
      const replacePixel = replace.getPixelXY(x, y);

      // Check if the pixel is already black (RGB: [0, 0, 0])
      if (!(pixel[0] === replacePixel[0] && pixel[1] === replacePixel[1] && pixel[2] === replacePixel[2])) {
        // Turn the pixel black
        image.setPixelXY(x, y, [replacePixel[0], replacePixel[1], replacePixel[2], pixel[3] || 255]); // Preserve alpha channel
        pixelTurnedBlack = true;
      }
    }

    // Save the modified image
    await image.save(outputPath);
    console.log('Random pixel colored.');
  } catch (error) {
    console.error('Error coloring pixel: ', error);
  }
}

// Start a 2-second interval to update the image
setInterval(() => {
  turnRandomPixelBlack();
}, 2000);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Public directory structure:
// - public/
//   - index.html
//   - images/
//     - example.jpg (original image)
//     - edited-example.jpg (output after effect)
