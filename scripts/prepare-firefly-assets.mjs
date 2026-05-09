import sharp from 'sharp';

const INPUT_DIR = 'src/assets/images/firefly';

const SOURCE_FILES = {
    normal: 'firefly_normal.png',
    blink: 'firefly_blink.png',
    smile: 'firefly_smile.png',
    surprised: 'firefly_surprised.png',
};

const OUTPUT_FILES = {
    base: 'firefly_base.webp',
    blinkOverlay: 'firefly_overlay_blink.webp',
    smileOverlay: 'firefly_overlay_smile.webp',
    surprisedOverlay: 'firefly_overlay_surprised.webp',
};

const BASE_CROP = {
    left: 191,
    top: 22,
    width: 627,
    height: 627,
};

const FACE_MASK = {
    centerX: 313,
    centerY: 168,
    radiusX: 96,
    radiusY: 112,
    feather: 0.16,
};

const isLikelyCheckerBackground = (red, green, blue, alpha) => {
    if (alpha <= 12) {
        return true;
    }

    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const brightness = (red + green + blue) / 3;

    return brightness >= 214 && (max - min) <= 26;
};

const floodFillBackground = ({ data, info }) => {
    const { width, height, channels } = info;
    const totalPixels = width * height;
    const visited = new Uint8Array(totalPixels);
    const queue = new Uint32Array(totalPixels);
    let head = 0;
    let tail = 0;

    const enqueue = (x, y) => {
        const index = y * width + x;
        if (visited[index]) {
            return;
        }

        const offset = index * channels;
        if (!isLikelyCheckerBackground(
            data[offset],
            data[offset + 1],
            data[offset + 2],
            data[offset + 3],
        )) {
            return;
        }

        visited[index] = 1;
        queue[tail++] = index;
    };

    for (let x = 0; x < width; x += 1) {
        enqueue(x, 0);
        enqueue(x, height - 1);
    }

    for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y);
        enqueue(width - 1, y);
    }

    while (head < tail) {
        const index = queue[head++];
        const x = index % width;
        const y = Math.floor(index / width);

        if (x > 0) enqueue(x - 1, y);
        if (x + 1 < width) enqueue(x + 1, y);
        if (y > 0) enqueue(x, y - 1);
        if (y + 1 < height) enqueue(x, y + 1);
    }

    return visited;
};

const makeTransparent = ({ data, info }) => {
    const output = Buffer.from(data);
    const backgroundMask = floodFillBackground({ data, info });

    for (let index = 0; index < backgroundMask.length; index += 1) {
        if (!backgroundMask[index]) {
            continue;
        }

        const offset = index * info.channels;
        output[offset + 3] = 0;
    }

    return output;
};

const applyFaceMask = ({ data, info }) => {
    const output = Buffer.from(data);
    const { width, height, channels } = info;
    const { centerX, centerY, radiusX, radiusY, feather } = FACE_MASK;
    const featherStart = 1 - feather;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const offset = (y * width + x) * channels;
            const dx = (x - centerX) / radiusX;
            const dy = (y - centerY) / radiusY;
            const distance = Math.sqrt((dx * dx) + (dy * dy));

            if (distance >= 1) {
                output[offset + 3] = 0;
                continue;
            }

            if (distance > featherStart) {
                const keepRatio = (1 - distance) / feather;
                output[offset + 3] = Math.round(output[offset + 3] * Math.max(0, Math.min(1, keepRatio)));
            }
        }
    }

    return output;
};

const toImage = (rawBuffer, info) => sharp(rawBuffer, {
    raw: {
        width: info.width,
        height: info.height,
        channels: info.channels,
    },
});

const readTransparentSource = async (fileName) => {
    const inputPath = `${INPUT_DIR}/${fileName}`;
    const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    return {
        info,
        data: makeTransparent({ data, info }),
    };
};

const readOverlaySource = async (fileName) => {
    const inputPath = `${INPUT_DIR}/${fileName}`;
    const { data, info } = await sharp(inputPath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    return { data, info };
};

const saveWebp = async (rawBuffer, info, outputFileName) => {
    const outputPath = `${INPUT_DIR}/${outputFileName}`;
    await toImage(rawBuffer, info)
        .webp({
            quality: 100,
            alphaQuality: 100,
            lossless: true,
        })
        .toFile(outputPath);

    return outputPath;
};

await sharp(`${INPUT_DIR}/firefly_select.png`)
    .extract(BASE_CROP)
    .webp({
        quality: 100,
        alphaQuality: 100,
        lossless: true,
    })
    .toFile(`${INPUT_DIR}/${OUTPUT_FILES.base}`);

for (const [expressionKey, fileName] of Object.entries(SOURCE_FILES)) {
    if (expressionKey === 'normal') {
        continue;
    }

    const expression = await readOverlaySource(fileName);
    const overlay = applyFaceMask(expression);
    const outputName = expressionKey === 'blink'
        ? OUTPUT_FILES.blinkOverlay
        : expressionKey === 'smile'
            ? OUTPUT_FILES.smileOverlay
            : OUTPUT_FILES.surprisedOverlay;

    await saveWebp(overlay, expression.info, outputName);
}

console.log('Prepared Firefly assets:', OUTPUT_FILES);
