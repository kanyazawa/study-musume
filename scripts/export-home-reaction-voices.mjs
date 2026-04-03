import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getAllHomeReactionVoiceLines } from '../src/data/homeReactions.js';
import { getAllHomeTouchVoiceLines } from '../src/data/homeTouchReactions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const DEFAULT_AIVIS_URL = 'http://127.0.0.1:10101';
const DEFAULT_LOCAL_FFMPEG_PATH = path.join(projectRoot, 'tools', 'ffmpeg', 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');

const parseArgs = (argv) => {
    const options = {
        baseUrl: DEFAULT_AIVIS_URL,
        format: 'mp3',
        overwrite: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];
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

    options.format = String(options.format || 'mp3').toLowerCase();
    if (!['wav', 'mp3'].includes(options.format)) {
        throw new Error('--format must be wav or mp3');
    }

    return options;
};

const normalizeSpeakerKey = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[／/]/g, '/')
    .replace(/\s+/g, ' ');

const getFfmpegCommand = (customPath) => customPath || process.env.FFMPEG_PATH || DEFAULT_LOCAL_FFMPEG_PATH || 'ffmpeg';

const ensureMp3Support = (customPath) => {
    const ffmpegCommand = getFfmpegCommand(customPath);
    const result = spawnSync(ffmpegCommand, ['-version'], {
        stdio: 'ignore',
    });

    if (result.status !== 0) {
        throw new Error('mp3 出力には ffmpeg が必要です。--ffmpeg-path で指定するか、FFMPEG_PATH を設定してください。');
    }

    return ffmpegCommand;
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

const resolveSpeaker = (speakers, value) => {
    const normalized = normalizeSpeakerKey(value);
    if (!normalized) {
        return speakers[0];
    }

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

    return partialMatch || speakers[0];
};

const synthesizeVoiceBuffer = async ({ baseUrl, text, speakerId }) => {
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

    return Buffer.from(await synthesisResponse.arrayBuffer());
};

const convertWavBufferToMp3 = async ({ wavBuffer, outputPath, ffmpegCommand }) => {
    const tempWavPath = `${outputPath}.tmp.wav`;
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(tempWavPath, wavBuffer);

    try {
        const result = spawnSync(
            ffmpegCommand,
            ['-y', '-i', tempWavPath, '-codec:a', 'libmp3lame', '-q:a', '4', outputPath],
            { stdio: 'ignore' }
        );

        if (result.status !== 0) {
            throw new Error('ffmpeg conversion failed');
        }
    } finally {
        await fs.rm(tempWavPath, { force: true });
    }
};

const synthesizeToFile = async ({ baseUrl, text, speakerId, outputPath, format, ffmpegCommand }) => {
    const voiceBuffer = await synthesizeVoiceBuffer({ baseUrl, text, speakerId });

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    if (format === 'mp3') {
        await convertWavBufferToMp3({ wavBuffer: voiceBuffer, outputPath, ffmpegCommand });
        return;
    }

    await fs.writeFile(outputPath, voiceBuffer);
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));
    const ffmpegCommand = options.format === 'mp3' ? ensureMp3Support(options['ffmpeg-path']) : null;
    const speakers = await listSpeakers(options.baseUrl);
    const lines = [
        ...getAllHomeReactionVoiceLines().map((line) => ({ group: 'reaction', ...line })),
        ...getAllHomeTouchVoiceLines().map((line) => ({ group: 'touch', ...line })),
    ].filter((line) => {
        if (options.character && line.characterId !== options.character) return false;
        if (options.group && line.group !== options.group) return false;
        return true;
    });

    if (lines.length === 0) {
        throw new Error('No home reaction lines found');
    }

    console.log(`Exporting ${lines.length} home voices...`);
    for (const line of lines) {
        const speaker = resolveSpeaker(speakers, line.ttsSpeaker);
        const outputPath = path.join(projectRoot, 'public', 'audio', ...String(line.voice).split('/'));

        if (!options.overwrite) {
            try {
                await fs.access(outputPath);
                console.log(`skip ${line.group}:${line.id} (${speaker.displayName})`);
                continue;
            } catch {
                // continue
            }
        }

        await synthesizeToFile({
            baseUrl: options.baseUrl,
            text: line.text,
            speakerId: speaker.styleId,
            outputPath,
            format: options.format,
            ffmpegCommand,
        });
        console.log(`ok   ${line.group}:${line.id} -> ${line.voice} (${speaker.displayName})`);
    }

    console.log('Home voice export completed');
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
