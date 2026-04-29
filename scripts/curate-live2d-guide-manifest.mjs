import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPsdFromManifestFile } from './build-live2d-psd-from-manifest.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const parseArgs = (argv) => {
    const options = {};
    const positionals = [];

    for (let index = 0; index < argv.length; index += 1) {
        const token = argv[index];
        if (!token.startsWith('--')) {
            positionals.push(token);
            continue;
        }

        const [rawKey, inlineValue] = token.split('=');
        const key = rawKey.replace(/^--/, '');
        if (inlineValue !== undefined) {
            options[key] = inlineValue;
            continue;
        }

        if (key === 'help') {
            options[key] = true;
            continue;
        }

        const nextValue = argv[index + 1];
        if (!nextValue || nextValue.startsWith('--')) {
            options[key] = true;
            continue;
        }

        options[key] = nextValue;
        index += 1;
    }

    return { options, positionals };
};

const printUsage = () => {
    console.log(`Usage:
  node scripts/curate-live2d-guide-manifest.mjs <manifest.json> [--profile legacy|school-girl]

What it does:
  1. Keeps the original extracted manifest untouched.
  2. Creates a curated manifest with obvious frame/text artifacts removed.
  3. Renames a few layer groups to more readable part names.
  4. Builds a second PSD + preview from the curated manifest.
`);
};

const buildSet = (values = []) => new Set(values);

const PROFILES = {
    legacy: {
        renameByName: {
            '01_face': {
                face_base_01: 'face_base',
                expression_top_01: 'expression_normal',
                expression_top_02: 'expression_smile',
                expression_top_03: 'expression_eyes_closed',
            },
            '02_hair': {
                hair_front_01: 'bangs_center',
                hair_front_02: 'bangs_left',
                hair_front_03: 'bangs_right',
                hair_side_01: 'side_hair_left_front',
                hair_side_02: 'side_hair_left_back',
                hair_side_03: 'side_hair_right_front',
                hair_side_04: 'side_hair_right_back',
                hair_back_01: 'back_hair_upper',
                hair_back_02: 'back_hair_lower',
            },
            '03_body_clothes': {
                body_clothes_01: 'neck',
                body_clothes_02: 'ribbon',
                body_clothes_03: 'hood',
                body_clothes_04: 'torso',
                body_clothes_05: 'shirt',
                body_clothes_06: 'sweater',
                body_clothes_07: 'parka',
                body_clothes_08: 'sleeve_left',
                body_clothes_09: 'sleeve_right',
            },
            '04_arms_hands': {
                arms_hands_01: 'hand_l_01',
                arms_hands_02: 'hand_l_02',
                arms_hands_03: 'arm_l_upper',
                arms_hands_04: 'arm_l_fore',
                arms_hands_05: 'hand_l_03',
                arms_hands_06: 'hand_l_04',
                arms_hands_07: 'arm_r_upper',
                arms_hands_08: 'arm_r_fore_inner',
                arms_hands_09: 'arm_r_fore_outer',
                arms_hands_10: 'hand_r_01',
                arms_hands_11: 'hand_r_02',
            },
            '05_lower_body': {
                lower_body_01: 'skirt',
                lower_body_02: 'leg_left',
                lower_body_03: 'leg_right',
                lower_body_04: 'sock_left',
                lower_body_05: 'sock_right',
                lower_body_06: 'shoe_left',
                lower_body_07: 'shoe_right',
            },
            '06_effects': {
                effects_left_01: 'hair_highlight_left_01',
                effects_left_02: 'hair_highlight_left_02',
                effects_left_03: 'cheek_left',
                effects_left_04: 'cheek_right',
                effects_left_05: 'shadow_01',
                effects_left_06: 'shadow_02',
                effects_left_07: 'shadow_03',
                effects_left_08: 'clothes_wrinkle_panel',
                effects_right_01: 'zipper_charm',
                effects_right_02: 'parka_cord_left',
                effects_right_03: 'parka_cord_right',
                effects_right_04: 'chest_cloth_left',
                effects_right_05: 'skirt_fold_line',
                effects_right_06: 'effect_shadow_large',
            },
        },
        dropByGroup: {
            '01_face': buildSet([
                'face_base_02',
                'expression_bottom_01',
            ]),
        },
        keepByGroup: {
            '03_body_clothes': buildSet([
                'body_clothes_01',
                'body_clothes_02',
                'body_clothes_03',
                'body_clothes_04',
                'body_clothes_05',
                'body_clothes_06',
                'body_clothes_07',
                'body_clothes_08',
                'body_clothes_09',
            ]),
            '04_arms_hands': buildSet([
                'arms_hands_01',
                'arms_hands_02',
                'arms_hands_03',
                'arms_hands_04',
                'arms_hands_05',
                'arms_hands_06',
                'arms_hands_07',
                'arms_hands_08',
                'arms_hands_09',
                'arms_hands_10',
                'arms_hands_11',
            ]),
            '06_effects': buildSet([
                'effects_left_01',
                'effects_left_02',
                'effects_left_03',
                'effects_left_04',
                'effects_left_05',
                'effects_left_06',
                'effects_left_07',
                'effects_left_08',
                'effects_right_01',
                'effects_right_02',
                'effects_right_03',
                'effects_right_04',
                'effects_right_05',
                'effects_right_06',
            ]),
        },
        orderByGroup: {
            '01_face': [
                'face_base',
                'eye_left_01',
                'eye_left_02',
                'eye_left_03',
                'eye_left_04',
                'eye_left_05',
                'eye_left_06',
                'eye_right_01',
                'eye_right_02',
                'eye_right_03',
                'eye_right_04',
                'eye_right_05',
                'mouth_01',
                'mouth_02',
                'mouth_03',
                'mouth_04',
                'mouth_05',
                'expression_normal',
                'expression_smile',
                'expression_eyes_closed',
            ],
            '02_hair': [
                'back_hair_lower',
                'back_hair_upper',
                'side_hair_left_back',
                'side_hair_right_back',
                'bangs_left',
                'bangs_center',
                'bangs_right',
                'side_hair_left_front',
                'side_hair_right_front',
            ],
            '03_body_clothes': [
                'torso',
                'neck',
                'shirt',
                'sweater',
                'parka',
                'hood',
                'sleeve_left',
                'sleeve_right',
                'ribbon',
            ],
            '04_arms_hands': [
                'arm_l_upper',
                'arm_l_fore',
                'hand_l_01',
                'hand_l_02',
                'hand_l_03',
                'hand_l_04',
                'arm_r_upper',
                'arm_r_fore_inner',
                'arm_r_fore_outer',
                'hand_r_01',
                'hand_r_02',
            ],
            '05_lower_body': [
                'leg_left',
                'leg_right',
                'sock_left',
                'sock_right',
                'shoe_left',
                'shoe_right',
                'skirt',
            ],
            '06_effects': [
                'effect_shadow_large',
                'shadow_01',
                'shadow_02',
                'shadow_03',
                'clothes_wrinkle_panel',
                'chest_cloth_left',
                'skirt_fold_line',
                'zipper_charm',
                'parka_cord_left',
                'parka_cord_right',
                'cheek_left',
                'cheek_right',
                'hair_highlight_left_01',
                'hair_highlight_left_02',
            ],
        },
    },
    'school-girl': {
        renameByName: {
            '01_face': {
                face_base_01: 'face_base',
                face_base_02: 'face_shadow_candidate',
                eye_left_01: 'eye_L_01',
                eye_left_02: 'eye_L_02',
                eye_left_03: 'eye_L_03',
                eye_left_04: 'eye_L_04',
                eye_left_05: 'eye_L_05',
                eye_left_06: 'eye_L_06',
                eye_right_01: 'eye_R_01',
                eye_right_02: 'eye_R_02',
                eye_right_03: 'eye_R_03',
                eye_right_04: 'eye_R_04',
                eye_right_05: 'eye_R_05',
                mouth_01: 'mouth_01',
                mouth_02: 'mouth_02',
                mouth_03: 'mouth_03',
                mouth_04: 'mouth_04',
                mouth_05: 'mouth_05',
                expression_top_01: 'exp_face_01',
                expression_top_02: 'exp_face_02',
                expression_top_03: 'exp_face_03',
                expression_bottom_01: 'exp_face_04',
            },
            '02_hair': {
                hair_front_01: 'hair_front_center',
                hair_front_02: 'hair_front_L',
                hair_front_03: 'hair_front_R',
                hair_side_01: 'hair_side_L_front',
                hair_side_02: 'hair_side_L_back',
                hair_side_03: 'hair_side_R_front',
                hair_side_04: 'hair_side_R_back',
                hair_back_01: 'hair_back_upper',
                hair_back_02: 'hair_back_lower',
            },
            '03_body_clothes': {
                body_clothes_01: 'neck',
                body_clothes_02: 'ribbon',
                body_clothes_03: 'hoodie_hood',
                body_clothes_04: 'torso_base',
                body_clothes_05: 'shirt',
                body_clothes_06: 'sweater',
                body_clothes_07: 'hoodie_body',
                body_clothes_08: 'sleeve_L',
                body_clothes_09: 'sleeve_R',
            },
            '04_arms_hands': {
                arms_hands_01: 'hand_L_01',
                arms_hands_02: 'hand_L_02',
                arms_hands_03: 'arm_upper_L',
                arms_hands_04: 'arm_fore_L',
                arms_hands_05: 'hand_L_03',
                arms_hands_06: 'hand_L_04',
                arms_hands_07: 'arm_upper_R',
                arms_hands_08: 'arm_fore_R_inner',
                arms_hands_09: 'arm_fore_R_outer',
                arms_hands_10: 'hand_R_01',
                arms_hands_11: 'hand_R_02',
            },
            '05_lower_body': {
                lower_body_01: 'skirt_base',
                lower_body_02: 'leg_L',
                lower_body_03: 'leg_R',
                lower_body_04: 'sock_L',
                lower_body_05: 'sock_R',
                lower_body_06: 'shoe_L',
                lower_body_07: 'shoe_R',
            },
            '06_effects': {
                effects_left_01: 'hair_highlight_L_01',
                effects_left_02: 'hair_highlight_L_02',
                effects_left_03: 'blush_L',
                effects_left_04: 'blush_R',
                effects_left_05: 'shadow_01',
                effects_left_06: 'shadow_02',
                effects_left_07: 'shadow_03',
                effects_left_08: 'cloth_wrinkle_panel',
                effects_right_01: 'hoodie_zipper_pull',
                effects_right_02: 'hoodie_string_L',
                effects_right_03: 'hoodie_string_R',
                effects_right_04: 'chest_cloth_L',
                effects_right_05: 'skirt_fold_line',
                effects_right_06: 'shadow_large',
            },
        },
        dropByGroup: {},
        keepByGroup: {
            '03_body_clothes': buildSet([
                'body_clothes_01',
                'body_clothes_02',
                'body_clothes_03',
                'body_clothes_04',
                'body_clothes_05',
                'body_clothes_06',
                'body_clothes_07',
                'body_clothes_08',
                'body_clothes_09',
            ]),
            '04_arms_hands': buildSet([
                'arms_hands_01',
                'arms_hands_02',
                'arms_hands_03',
                'arms_hands_04',
                'arms_hands_05',
                'arms_hands_06',
                'arms_hands_07',
                'arms_hands_08',
                'arms_hands_09',
                'arms_hands_10',
                'arms_hands_11',
            ]),
            '06_effects': buildSet([
                'effects_left_01',
                'effects_left_02',
                'effects_left_03',
                'effects_left_04',
                'effects_left_05',
                'effects_left_06',
                'effects_left_07',
                'effects_left_08',
                'effects_right_01',
                'effects_right_02',
                'effects_right_03',
                'effects_right_04',
                'effects_right_05',
                'effects_right_06',
            ]),
        },
        orderByGroup: {
            '01_face': [
                'face_base',
                'face_shadow_candidate',
                'eye_L_01',
                'eye_L_02',
                'eye_L_03',
                'eye_L_04',
                'eye_L_05',
                'eye_L_06',
                'eye_R_01',
                'eye_R_02',
                'eye_R_03',
                'eye_R_04',
                'eye_R_05',
                'mouth_01',
                'mouth_02',
                'mouth_03',
                'mouth_04',
                'mouth_05',
                'exp_face_01',
                'exp_face_02',
                'exp_face_03',
                'exp_face_04',
            ],
            '02_hair': [
                'hair_back_lower',
                'hair_back_upper',
                'hair_side_L_back',
                'hair_side_R_back',
                'hair_front_L',
                'hair_front_center',
                'hair_front_R',
                'hair_side_L_front',
                'hair_side_R_front',
            ],
            '03_body_clothes': [
                'torso_base',
                'neck',
                'shirt',
                'sweater',
                'hoodie_body',
                'hoodie_hood',
                'sleeve_L',
                'sleeve_R',
                'ribbon',
            ],
            '04_arms_hands': [
                'arm_upper_L',
                'arm_fore_L',
                'hand_L_01',
                'hand_L_02',
                'hand_L_03',
                'hand_L_04',
                'arm_upper_R',
                'arm_fore_R_inner',
                'arm_fore_R_outer',
                'hand_R_01',
                'hand_R_02',
            ],
            '05_lower_body': [
                'leg_L',
                'leg_R',
                'sock_L',
                'sock_R',
                'shoe_L',
                'shoe_R',
                'skirt_base',
            ],
            '06_effects': [
                'shadow_large',
                'shadow_01',
                'shadow_02',
                'shadow_03',
                'cloth_wrinkle_panel',
                'chest_cloth_L',
                'skirt_fold_line',
                'hoodie_zipper_pull',
                'hoodie_string_L',
                'hoodie_string_R',
                'blush_L',
                'blush_R',
                'hair_highlight_L_01',
                'hair_highlight_L_02',
            ],
        },
    },
};

const curateChildren = (groupName, children = [], profile) => {
    const keepSet = profile.keepByGroup[groupName];
    const renameMap = profile.renameByName[groupName] || {};
    const dropSet = profile.dropByGroup[groupName];
    const orderedNames = profile.orderByGroup[groupName] || [];
    const orderIndex = new Map(orderedNames.map((name, index) => [name, index]));

    return children
        .filter((child) => !dropSet || !dropSet.has(child.name))
        .filter((child) => !keepSet || keepSet.has(child.name))
        .map((child) => ({
            ...child,
            name: renameMap[child.name] || child.name,
        }))
        .sort((left, right) => {
            const leftIndex = orderIndex.has(left.name) ? orderIndex.get(left.name) : Number.MAX_SAFE_INTEGER;
            const rightIndex = orderIndex.has(right.name) ? orderIndex.get(right.name) : Number.MAX_SAFE_INTEGER;
            if (leftIndex !== rightIndex) {
                return leftIndex - rightIndex;
            }
            return left.name.localeCompare(right.name);
        });
};

const curateManifest = (manifest, curatedManifestPath, profileKey) => {
    const curatedBaseName = path.basename(curatedManifestPath, path.extname(curatedManifestPath));
    const curatedDir = path.dirname(curatedManifestPath);
    const profile = PROFILES[profileKey];

    return {
        ...manifest,
        name: `${manifest.name || 'live2d-guide'}-curated`,
        output: {
            psd: path.join(curatedDir, `${curatedBaseName}.psd`),
            preview: path.join(curatedDir, `${curatedBaseName}-preview.png`),
        },
        children: (manifest.children || []).map((group) => (
            Array.isArray(group.children)
                ? {
                    ...group,
                    children: curateChildren(group.name, group.children, profile),
                }
                : group
        )),
        metadata: {
            ...(manifest.metadata || {}),
            curated: true,
            curatedProfile: profileKey,
            curatedAt: new Date().toISOString(),
        },
    };
};

const resolveCuratedManifestPath = (inputPath, profileKey) => {
    if (profileKey === 'legacy') {
        return inputPath.replace(/-manifest\.json$/i, '-curated-manifest.json');
    }

    return inputPath.replace(/-manifest\.json$/i, `-${profileKey}-curated-manifest.json`);
};

const main = async () => {
    const { options, positionals } = parseArgs(process.argv.slice(2));
    if (options.help || positionals.length === 0) {
        printUsage();
        return;
    }

    const profileKey = String(options.profile || 'legacy');
    if (!PROFILES[profileKey]) {
        throw new Error(`Unknown profile "${profileKey}". Use one of: ${Object.keys(PROFILES).join(', ')}`);
    }

    const inputPath = path.resolve(repoRoot, positionals[0]);
    const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
    const curatedManifestPath = resolveCuratedManifestPath(inputPath, profileKey);
    const curated = curateManifest(input, curatedManifestPath, profileKey);

    await fs.writeFile(curatedManifestPath, `${JSON.stringify(curated, null, 2)}\n`, 'utf8');
    console.log(`Curated manifest: ${curatedManifestPath}`);

    const buildResult = await buildPsdFromManifestFile(curatedManifestPath);
    console.log(`PSD: ${buildResult.psdPath}`);
    if (buildResult.previewPath) {
        console.log(`Preview: ${buildResult.previewPath}`);
    }
};

if (path.resolve(process.argv[1] || '') === __filename) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}
