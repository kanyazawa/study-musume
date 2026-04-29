import fs from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const atlasRoot = path.join(
  workspaceRoot,
  'output',
  'live2d-parts',
  'witch',
  'atlas-components',
);
const organizedRoot = path.join(atlasRoot, 'organized');

const curated = new Map(
  Object.entries({
    'texture_00:1': { category: 'hair', label: 'side_lock_left' },
    'texture_00:2': { category: 'hair', label: 'back_center' },
    'texture_00:4': { category: 'accessories', label: 'wing_trim_left' },
    'texture_00:5': { category: 'body', label: 'arm_left' },
    'texture_00:8': { category: 'body', label: 'leg_right' },
    'texture_00:9': { category: 'hair', label: 'side_flow_right' },
    'texture_00:10': { category: 'hat', label: 'star_trim_left' },
    'texture_00:37': { category: 'hair', label: 'curl_front_small' },
    'texture_00:46': { category: 'hair', label: 'inner_lock_white' },
    'texture_00:50': { category: 'clothing', label: 'stocking_left' },
    'texture_00:54': { category: 'hat', label: 'brim_top' },
    'texture_00:55': { category: 'clothing', label: 'shoe_left' },
    'texture_00:66': { category: 'hair', label: 'side_flow_lower_right' },
    'texture_00:67': { category: 'clothing', label: 'shoulder_bow_left' },
    'texture_00:68': { category: 'hat', label: 'brim_panel_left' },
    'texture_00:84': { category: 'clothing', label: 'stocking_right' },
    'texture_00:91': { category: 'hair', label: 'back_shadow_left' },
    'texture_00:99': { category: 'body', label: 'arm_right' },
    'texture_00:103': { category: 'hair', label: 'braid_outline' },
    'texture_00:107': { category: 'hat', label: 'brim_panel_right' },
    'texture_00:122': { category: 'body', label: 'torso_skin_right' },
    'texture_00:126': { category: 'clothing', label: 'sleeve_gem_left' },
    'texture_00:128': { category: 'clothing', label: 'shoulder_bow_right' },
    'texture_00:133': { category: 'hair', label: 'back_shadow_right' },
    'texture_00:151': { category: 'hat', label: 'brim_inner' },
    'texture_00:152': { category: 'clothing', label: 'neck_frill' },
    'texture_00:155': { category: 'hair', label: 'inner_lock_long' },
    'texture_00:159': { category: 'clothing', label: 'skirt_frill_dark' },
    'texture_00:162': { category: 'clothing', label: 'sleeve_gem_right' },
    'texture_00:172': { category: 'hat', label: 'brim_frill_inner' },
    'texture_00:177': { category: 'accessories', label: 'belt_brooch_chain' },
    'texture_00:178': { category: 'body', label: 'neck_skin_ring' },
    'texture_00:182': { category: 'hair', label: 'flow_strip_left' },
    'texture_00:198': { category: 'body', label: 'torso_skin_left' },
    'texture_00:199': { category: 'hat', label: 'crown_cap' },
    'texture_00:200': { category: 'clothing', label: 'bow_shadow' },
    'texture_00:201': { category: 'accessories', label: 'feather_black' },
    'texture_00:202': { category: 'accessories', label: 'feather_star_soft' },
    'texture_00:203': { category: 'clothing', label: 'blouse_front' },
    'texture_00:204': { category: 'clothing', label: 'skirt_frill_short' },
    'texture_00:205': { category: 'hat', label: 'star_band_left' },
    'texture_00:206': { category: 'clothing', label: 'collar_back_shadow' },
    'texture_00:212': { category: 'clothing', label: 'collar_front_white' },
    'texture_00:213': { category: 'clothing', label: 'skirt_pattern_panel' },
    'texture_00:215': { category: 'clothing', label: 'shoulder_panel_left' },
    'texture_00:220': { category: 'face_skin', label: 'face_base' },
    'texture_00:223': { category: 'clothing', label: 'collar_panel_right' },
    'texture_00:224': { category: 'body', label: 'arm_horizontal' },
    'texture_00:225': { category: 'clothing', label: 'shoulder_frill_left' },
    'texture_00:228': { category: 'clothing', label: 'shoulder_frill_right' },
    'texture_00:229': { category: 'face_skin', label: 'chin_mouth_base' },
    'texture_00:230': { category: 'clothing', label: 'collar_panel_left' },
    'texture_00:232': { category: 'clothing', label: 'shoulder_panel_right' },
    'texture_00:235': { category: 'hat', label: 'star_band_right' },

    'texture_01:3': { category: 'face_skin', label: 'eyelash_line_right' },
    'texture_01:4': { category: 'face_skin', label: 'eyelash_line_left' },
    'texture_01:7': { category: 'hair', label: 'side_curl_left_small' },
    'texture_01:11': { category: 'hair', label: 'curl_front_large' },
    'texture_01:13': { category: 'accessories', label: 'staff' },
    'texture_01:14': { category: 'face_skin', label: 'face_outline' },
    'texture_01:16': { category: 'hair', label: 'back_sheet_left' },
    'texture_01:20': { category: 'face_skin', label: 'mouth_line' },
    'texture_01:21': { category: 'hair', label: 'curl_tip_right' },
    'texture_01:23': { category: 'hair', label: 'curl_tip_left' },
    'texture_01:24': { category: 'accessories', label: 'earring_crystal_right' },
    'texture_01:25': { category: 'hair', label: 'side_curl_right_small' },
    'texture_01:29': { category: 'clothing', label: 'waist_bow_left' },
    'texture_01:30': { category: 'effects', label: 'glow_shape_large' },
    'texture_01:31': { category: 'accessories', label: 'waist_brooch' },
    'texture_01:34': { category: 'hair', label: 'thin_curl' },
    'texture_01:35': { category: 'clothing', label: 'bow_shadow_large' },
    'texture_01:38': { category: 'hair', label: 'front_lock_left' },
    'texture_01:40': { category: 'clothing', label: 'waist_bow_right' },
    'texture_01:42': { category: 'accessories', label: 'earring_crystal_left' },
    'texture_01:43': { category: 'clothing', label: 'outer_coat_left' },
    'texture_01:44': { category: 'hair', label: 'back_sheet_right' },
    'texture_01:45': { category: 'hair', label: 'back_mass_center' },
    'texture_01:46': { category: 'hair', label: 'front_lock_right' },
    'texture_01:47': { category: 'hair', label: 'side_lock_left_long' },
    'texture_01:48': { category: 'effects', label: 'blue_flame' },
    'texture_01:49': { category: 'clothing', label: 'outer_coat_right' },
    'texture_01:50': { category: 'hair', label: 'side_lock_right_long' },
    'texture_01:52': { category: 'misc', label: 'large_back_fill' },
  }),
);

async function main() {
  const summaryPath = path.join(atlasRoot, 'summary.json');
  const summaries = JSON.parse(await fs.readFile(summaryPath, 'utf8'));

  await fs.rm(organizedRoot, { recursive: true, force: true });
  await fs.mkdir(organizedRoot, { recursive: true });

  const index = [];
  const categoryCounts = new Map();

  for (const summary of summaries) {
    const manifest = JSON.parse(await fs.readFile(summary.manifestPath, 'utf8'));
    for (const entry of manifest) {
      const textureBase = path.basename(entry.texture, '.png');
      const key = `${textureBase}:${entry.componentIndex}`;
      const selected = curated.get(key) ?? { category: 'misc', label: null };
      const sourceFile = entry.file;
      const ext = path.extname(sourceFile);
      const sourceBase = path.basename(sourceFile, ext);
      const suffix = selected.label ? `_${selected.label}` : '';
      const targetDir = path.join(organizedRoot, selected.category);
      const targetFile = path.join(targetDir, `${sourceBase}${suffix}${ext}`);

      await fs.mkdir(targetDir, { recursive: true });
      await fs.copyFile(sourceFile, targetFile);

      categoryCounts.set(selected.category, (categoryCounts.get(selected.category) ?? 0) + 1);
      index.push({
        texture: entry.texture,
        componentIndex: entry.componentIndex,
        category: selected.category,
        label: selected.label,
        curated: curated.has(key),
        pixelCount: entry.pixelCount,
        bbox: entry.bbox,
        sourceFile,
        organizedFile: targetFile,
      });
    }
  }

  index.sort((left, right) => {
    if (left.category !== right.category) {
      return left.category.localeCompare(right.category);
    }
    if (left.curated !== right.curated) {
      return Number(right.curated) - Number(left.curated);
    }
    return right.pixelCount - left.pixelCount;
  });

  const summary = {
    note: 'Rough visual grouping from atlas-connected-component export. Curated entries are hand-labeled; everything else falls back to misc.',
    totalComponents: index.length,
    curatedComponents: index.filter((entry) => entry.curated).length,
    categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort()),
  };

  await fs.writeFile(
    path.join(organizedRoot, 'index.json'),
    `${JSON.stringify(index, null, 2)}\n`,
    'utf8',
  );
  await fs.writeFile(
    path.join(organizedRoot, 'summary.json'),
    `${JSON.stringify(summary, null, 2)}\n`,
    'utf8',
  );

  const readmeLines = [
    '# Organized Witch Atlas Components',
    '',
    'This folder is a rough visual grouping built from the atlas component export.',
    'Hand-labeled pieces use readable suffixes. Everything not curated is placed in `misc`.',
    '',
    'Categories:',
    ...Object.entries(summary.categoryCounts).map(([category, count]) => `- ${category}: ${count}`),
    '',
    'Reference files:',
    '- index.json: per-component mapping with source and organized paths',
    '- summary.json: category totals',
    '',
    'Important note:',
    '- This is based on atlas texture shapes, not on original Live2D logical part IDs.',
    '- Some labels are best-effort guesses to make browsing faster.',
  ];

  await fs.writeFile(path.join(organizedRoot, 'README.md'), `${readmeLines.join('\n')}\n`, 'utf8');

  console.log(`Organized ${index.length} components into ${organizedRoot}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
