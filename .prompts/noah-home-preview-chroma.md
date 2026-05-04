Use case: background-extraction
Asset type: home screen character preview for study-musume
Primary request: Edit the provided anime character illustration. Preserve the exact same girl, outfit design, proportions, pose, expression, and overall polished school-life anime rendering. Replace the entire background with a perfectly flat solid chroma-key green (#00ff00) for background removal. The background must be one uniform color only: no gradients, no shadows, no floor plane, no texture, no glow, and no white vignette. Keep the character fully intact with clean crisp edges, especially around the hair, hoodie outline, fingers, and skirt hem. Do not use #00ff00 anywhere in the character. Full body, centered, generous padding, same front-facing composition.
Input images: generated preview image as edit target
Output note: rendered with built-in image_gen, then consumed in-app via runtime chroma key removal because local Python transparency helper was unavailable in this environment.
