import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { parseCsvTable } from '../src/utils/csvUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const exportScriptPath = path.join(__dirname, 'export-aivis-voices.mjs');

const printUsage = () => {
    console.log(`Usage:
  node scripts/publish-aivis-scene.mjs --input <csv-or-url> --sheet <scene-name> [options]

Options:
  --fallback-speaker <name>  Speaker name or "speaker / style"
  --base-url <url>           AivisSpeech Engine URL
  --output-dir <dir>         Audio output directory
  --format <wav|mp3>         Output audio format (default: wav)
  --ffmpeg-path <path>       ffmpeg path for mp3 conversion
  --write-csv <file>         Generated CSV output path
  --voice-only <file>        Voice-only text output path
  --commit-message <text>    Git commit message
  --dry-run                  Preview only
  --skip-git                 Skip git add/commit/push
  --skip-push                Create commit but do not push
  --no-overwrite             Keep existing voice values
`);
};

const parseArgs = (argv) => {
    const options = {
        overwrite: true,
        skipGit: false,
        skipPush: false,
        dryRun: false,
    };

    for (let index = 0; index < argv.length; index += 1) {
        const arg = argv[index];

        if (arg === '--dry-run') {
            options.dryRun = true;
            continue;
        }
        if (arg === '--skip-git') {
            options.skipGit = true;
            continue;
        }
        if (arg === '--skip-push') {
            options.skipPush = true;
            continue;
        }
        if (arg === '--no-overwrite') {
            options.overwrite = false;
            continue;
        }
        if (!arg.startsWith('--')) {
            continue;
        }

        const key = arg.slice(2);
        const nextValue = argv[index + 1];
        if (!nextValue || nextValue.startsWith('--')) {
            printUsage();
            throw new Error(`Missing value for --${key}`);
        }
        options[key] = nextValue;
        index += 1;
    }

    if (!options.input || !options.sheet) {
        printUsage();
        throw new Error('--input and --sheet are required');
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

const ensureExtension = (value, extension) => {
    if (!value) return value;
    return value.toLowerCase().endsWith(extension) ? value : `${value}${extension}`;
};

const resolveOutputPath = (value, fallbackValue, extension) => {
    const candidate = ensureExtension(value || fallbackValue, extension);
    return path.isAbsolute(candidate) ? candidate : path.join(projectRoot, candidate);
};

const runCommand = (command, args, options = {}) => execFileSync(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    ...options,
});

const createVoiceOnlyFile = async ({ csvPath, sceneName, outputPath }) => {
    const csvText = await fs.readFile(csvPath, 'utf8');
    const rows = parseCsvTable(csvText);
    if (rows.length === 0) {
        throw new Error(`CSV is empty: ${csvPath}`);
    }

    const headers = rows[0].map((cell) => cell.trim().toLowerCase());
    const sceneIndex = headers.indexOf('scene');
    const voiceIndex = headers.indexOf('voice');

    if (sceneIndex < 0 || voiceIndex < 0) {
        throw new Error('scene または voice 列が見つかりません');
    }

    const voiceLines = rows
        .slice(1)
        .filter((row) => row[sceneIndex] === sceneName)
        .map((row) => row[voiceIndex] || '');

    if (voiceLines.length === 0) {
        throw new Error(`Scene not found in CSV: ${sceneName}`);
    }

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, voiceLines.join('\n'), 'utf8');
    return voiceLines;
};

const stageAndPublishAudio = ({ sceneName, commitMessage, skipPush }) => {
    const audioFolder = path.join('public', 'audio', 'tts-generated', sanitizeSegment(sceneName));
    runCommand('git', ['add', audioFolder]);

    const diffResult = spawnSync('git', ['diff', '--cached', '--quiet', '--', audioFolder], {
        cwd: projectRoot,
        stdio: 'ignore',
    });

    if (diffResult.status === 0) {
        console.log(`No new audio changes to commit for "${sceneName}".`);
        return;
    }
    if (diffResult.status !== 1) {
        throw new Error('Failed to check staged git diff');
    }

    runCommand('git', ['commit', '-m', commitMessage]);
    if (!skipPush) {
        const branch = execFileSync('git', ['branch', '--show-current'], { cwd: projectRoot, encoding: 'utf8' }).trim();
        runCommand('git', ['push', 'origin', branch]);
    }
};

const main = async () => {
    const options = parseArgs(process.argv.slice(2));
    const sceneSlug = sanitizeSegment(options.sheet);
    const writeCsvPath = resolveOutputPath(options['write-csv'], path.join('tmp', `${sceneSlug}.with-voice`), '.csv');
    const voiceOnlyPath = resolveOutputPath(options['voice-only'], path.join('tmp', `${sceneSlug}.voice-only`), '.txt');

    const exportArgs = [
        exportScriptPath,
        '--input', options.input,
        '--sheet', options.sheet,
        '--write-csv', writeCsvPath,
    ];

    if (options.format) {
        exportArgs.push('--format', options.format);
    }
    if (options['ffmpeg-path']) {
        exportArgs.push('--ffmpeg-path', options['ffmpeg-path']);
    }
    if (options.overwrite) {
        exportArgs.push('--overwrite');
    }
    if (options['fallback-speaker']) {
        exportArgs.push('--fallback-speaker', options['fallback-speaker']);
    }
    if (options['base-url']) {
        exportArgs.push('--base-url', options['base-url']);
    }
    if (options['output-dir']) {
        exportArgs.push('--output-dir', options['output-dir']);
    }
    if (options.dryRun) {
        exportArgs.push('--dry-run');
    }

    runCommand(process.execPath, exportArgs);

    if (options.dryRun) {
        console.log('Dry run complete. No voice-only file or git publish was performed.');
        return;
    }

    const voiceLines = await createVoiceOnlyFile({
        csvPath: writeCsvPath,
        sceneName: options.sheet,
        outputPath: voiceOnlyPath,
    });

    console.log(`Created voice-only file: ${path.relative(projectRoot, voiceOnlyPath)}`);
    console.log(`Voice rows: ${voiceLines.length}`);

    if (!options.skipGit) {
        const commitMessage = options['commit-message'] || `Publish Aivis audio for ${options.sheet}`;
        stageAndPublishAudio({
            sceneName: options.sheet,
            commitMessage,
            skipPush: options.skipPush,
        });
    }
};

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
