import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, 'public/live2d/models/free-witch/魔女/魔女.8192/texture_00.png');
const outputPath = path.join(__dirname, 'public/live2d/models/free-witch/魔女/魔女.8192/texture_00_opt.png');

console.log('Resizing file:', inputPath);

sharp(inputPath)
    .resize(4096)
    .toFile(outputPath)
    .then((info) => {
        console.log('Resize successful!', info);
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);
        console.log('Replaced original file successfully.');
    })
    .catch((err) => {
        console.error('Error during resizing:', err);
        process.exit(1);
    });
