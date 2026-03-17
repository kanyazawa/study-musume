import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsvTable } from '../src/utils/csvUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_AIVIS_URL = 'http://127.0.0.1:10101';
const DEFAULT_OUTPUT_DIR = path.join(projectRoot, 'public', 'audio', 'tts-generated');

const printUsage = () => {
    console.log(`Usage:
  node scripts/export-aivis-voices.mjs --input <csv-or-url> [options]

Options:
  --sheet <scene-name>         Filter by scene name
  --output-dir <dir>           Output directory (default: public/audio/tts-generated)
  --base-url <url>             AivisSpeech Engine URL (default: http://127.0.0.1:10101)
  --fallback-speaker <name>    Speaker name or "speaker / style"
  --write-csv <file>           Write CSV with voice column filled
  --dry-run                    Show what would be generated without writing audio
  --overwrite                  Regenerate files even if they already exist
`);
};

const parseArgs = (argv) => {
    const options = {
        baseUrl: DEFAULT_AIVIS_URL,
        outputDir: DEFAULT_OUTPUT_DIR,
        dryRun: false,
        overwrite: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
        if (arg === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        if (arg === '--overwrite') {
            options.overwrite = true;
            continue;
        }
        if (!arg.startsWith('--')) {
            continue;
        }

        const key = arg.slice(2);
        const nextValue = argv[index + 1];
        if (!nextValue || nextValue.startsWith('--')) {
            throw new Error(`Missing value for --${key}`);
        }
        options[key] = nextValue;
        index += 1;
    }

    if (!options.input) {
        printUsage();
        throw new Error('--input is required');
    }

    return options;
};

const sanitizeSegment = (value, fallback = 'item') => {
    const normalized = String(value || '')
        .normalize('NFKC')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
        .replace(/\s+/g, '-')
        .replace(/\.+$/g, '')
        .trim();
    return normalized || fallback;
};

const csvEscape = (value) => {
    const text = String(value ?? '');
    if (!/[",\r\n]/.test(text)) {
        return text;
    }
    return `"${text.replace(/"/g, '""')}"`;
};

const serializeCsv = (rows) => rows.map((row) => row.map(csvEscape).join(',')).join('\n');

const normalizeSpeakerKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[／/]/g, '/')
    .replace(/\s+/g, ' ');

const loadCsvText = async (input) => {
    if (/^https?:\/\//i.test(input)) {
        const response = await fetch(input);
        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status}`);
        }
        return response.text();
    }

    const resolvedPath = path.isAbsolute(input) ? input : path.join(projectRoot, input);
    return fs.readFile(resolvedPath, 'utf8');
};

const listSpeakers = async (baseUrl) => {
    const response = await fetch(`${baseUrl}/speakers`);
    if (!response.ok) {
        throw new Error(`Failed to fetch Aivis speakers: ${response.status}`);
    }
    const data = await response.json();
    return data.flatMap((speaker) =>
        (speaker.styles || []).map((style) => ({
            speakerName: speaker.name,
            styleName: style.name,
            styleId: style.id,
            displayName: `${speaker.name} / ${style.name}`,
        }))
    );
};

const resolveSpeaker = (speakers, value, fallbackSpeaker) => {
    const normalized = normalizeSpeakerKey(value);
    if (normalized) {
        const exactMatch = speakers.find((speaker) => {
            const speakerName = normalizeSpeakerKey(speaker.speakerName);
            const styleName = normalizeSpeakerKey(speaker.styleName);
            const displayName = normalizeSpeakerKey(speaker.displayName);
            return normalized === displayName
                || normalized === `${speakerName}/${styleName}`
                || normalized === speakerName
                || normalized === styleName
                || normalized === String(speaker.styleId);
        });
        if (exactMatch) {
            return exactMatch;
        }

        const partialMatch = speakers.find((speaker) => {
            const speakerName = normalizeSpeakerKey(speaker.speakerName);
            const styleName = normalizeSpeakerKey(speaker.styleName);
            return speakerName.includes(normalized)
                || normalized.includes(speakerName)
                || styleName.includes(normalized)
                || normalized.includes(styleName);
        });
        if (partialMatch) {
            return partialMatch;
        }
    }

    return fallbackSpeaker ?? speakers[0];
};

const synthesizeToFile = async ({ baseUrl, text, speakerId, outputPath }) => {
    const queryResponse = await fetch(
        `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speakerId}`,
        { method: 'POST' }
    );
    if (!queryResponse.ok) {
        throw new Error(`audio_query failed: ${queryResponse.status}`);
    }

    const audioQuery = await queryResponse.json();
    const synthesisResponse = await fetch(`${baseUrl}/synthesis?speaker=${speakerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioQuery),
    });
    if (!synthesisResponse.ok) {
        throw new Error(`synthesis failed: ${synthesisResponse.status}`);
    }

    const arrayBuffer = await synthesisResponse.arrayBuffer();
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, Buffer.from(arrayBuffer));
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));
    const csvText = await loadCsvText(options.input);
    const rows = parseCsvTable(csvText);

    if (rows.length === 0) {
        throw new Error('CSV is empty');
    }

    const headers = rows[0].map((cell) => cell.trim());
    const normalizedHeaders = headers.map((cell) => cell.trim().toLowerCase());
    const sceneIndex = normalizedHeaders.indexOf('scene');
    const idIndex = normalizedHeaders.findIndex((cell) => cell === 'id' || cell === 'order');
    const textIndex = normalizedHeaders.indexOf('text');
    const speakerIndex = normalizedHeaders.indexOf('speaker');
    const ttsSpeakerIndex = normalizedHeaders.indexOf('tts_speaker');
    const voiceIndex = normalizedHeaders.indexOf('voice');

    if (textIndex < 0) {
        throw new Error('CSV must contain a text column');
    }

    const speakers = await listSpeakers(options.baseUrl);
    if (speakers.length === 0) {
        throw new Error('No AivisSpeech speakers found');
    }

    const fallbackSpeaker = resolveSpeaker(speakers, options['fallback-speaker'], speakers[0]);
    const outputRows = rows.map((row) => [...row]);
    const generated = [];

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const row = rows[rowIndex];
        const scene = sceneIndex >= 0 ? row[sceneIndex] : '';
        if (options.sheet && scene !== options.sheet) {
            continue;
        }

        const text = (row[textIndex] || '').trim();
        if (!text) {
            continue;
        }

        const speakerLabel = speakerIndex >= 0 ? row[speakerIndex] : '';
        if (speakerLabel === 'Quiz' || speakerLabel === 'System') {
            continue;
        }

        const existingVoice = voiceIndex >= 0 ? (row[voiceIndex] || '').trim() : '';
        if (existingVoice && !options.overwrite) {
            continue;
        }

        const requestedSpeaker = ttsSpeakerIndex >= 0 ? row[ttsSpeakerIndex] : '';
        const speaker = resolveSpeaker(speakers, requestedSpeaker, fallbackSpeaker);

        const sceneSegment = sanitizeSegment(scene || 'default-scene');
        const idSegment = sanitizeSegment((idIndex >= 0 ? row[idIndex] : '') || String(rowIndex), `line-${rowIndex}`);
        const speakerSegment = sanitizeSegment(speaker.speakerName);
        const filename = `${sceneSegment}-${idSegment}-${speakerSegment}-${speaker.styleId}.wav`;
        const relativeVoicePath = `tts-generated/${sceneSegment}/${filename}`.replace(/\\/g, '/');
        const outputPath = path.join(options.outputDir, sceneSegment, filename);

        generated.push({
            rowIndex: rowIndex + 1,
            scene,
            id: idIndex >= 0 ? row[idIndex] : '',
            speaker: speaker.displayName,
            voice: relativeVoicePath,
            text,
        });

        if (voiceIndex >= 0) {
            outputRows[rowIndex][voiceIndex] = relativeVoicePath;
        }

        if (!options.dryRun) {
            await synthesizeToFile({
                baseUrl: options.baseUrl,
                text,
                speakerId: speaker.styleId,
                outputPath,
            });
        }
    }

    if (options['write-csv']) {
        const outputCsvPath = path.isAbsolute(options['write-csv'])
            ? options['write-csv']
            : path.join(projectRoot, options['write-csv']);
        await fs.mkdir(path.dirname(outputCsvPath), { recursive: true });
        await fs.writeFile(outputCsvPath, serializeCsv(outputRows), 'utf8');
    }

    console.log(`AivisSpeech export ${options.dryRun ? 'preview' : 'completed'}: ${generated.length} lines`);
    if (generated.length > 0) {
        for (const item of generated.slice(0, 20)) {
            console.log(`[row ${item.rowIndex}] ${item.scene || '-'} / ${item.id || '-'} -> ${item.voice} (${item.speaker})`);
        }
        if (generated.length > 20) {
            console.log(`...and ${generated.length - 20} more`);
        }
    }
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
