/**
 * FALLBACK ONLY. The real source of truth is the backend's tools_config
 * table (admin-configurable, zero-hardcode). Tools.jsx tries GET /tools
 * first and only falls back to this list if that call fails — useful
 * while the backend isn't wired up yet. Slugs here should match whatever
 * the backend actually returns.
 */
export const TOOL_CATEGORIES = [
  {
    id: 'basic',
    label: 'Basic',
    tools: [
      { slug: 'crop', name: 'Crop', description: 'Cut your image down to the frame you want.', credits: 1 },
      { slug: 'resize', name: 'Resize', description: 'Change dimensions without losing quality.', credits: 1 },
      { slug: 'compress', name: 'Compress', description: 'Shrink file size, keep the detail.', credits: 1 },
    ],
  },
  {
    id: 'enhance',
    label: 'Enhance',
    tools: [
      { slug: 'color', name: 'Color', description: 'Adjust brightness, contrast, and saturation.', credits: 1 },
      { slug: 'filter', name: 'Filter', description: 'Apply a stylistic look in one click.', credits: 1 },
      { slug: 'sharpen', name: 'Sharpen', description: 'Bring out edges and fine detail.', credits: 1 },
      { slug: 'noise', name: 'Denoise', description: 'Clean up grain and sensor noise.', credits: 1 },
    ],
  },
  {
    id: 'ai-edit',
    label: 'AI Edit',
    tools: [
      { slug: 'bg-remove', name: 'Background Remove', description: 'Cut the subject out, cleanly.', credits: 3 },
      { slug: 'inpaint', name: 'Inpaint', description: 'Erase or replace part of an image.', credits: 4 },
      { slug: 'outpaint', name: 'Outpaint', description: 'Extend an image beyond its borders.', credits: 4 },
      { slug: 'upscale', name: 'Upscale', description: 'Increase resolution without losing sharpness.', credits: 3 },
      { slug: 'face-restore', name: 'Face Restore', description: 'Fix blurry or low-quality faces.', credits: 3 },
      { slug: 'old-photo-repair', name: 'Old Photo Repair', description: 'Restore scratches, fading, and tears.', credits: 4 },
    ],
  },
  {
    id: 'generate',
    label: 'Generate',
    tools: [
      { slug: 'text-to-image', name: 'Text to Image', description: 'Describe it, get a brand-new image.', credits: 5 },
      { slug: 'character-gen', name: 'Character Generator', description: 'Create a consistent character design.', credits: 6 },
      { slug: 'character-control', name: 'Character Control', description: 'Pose and direct an existing character.', credits: 6 },
      { slug: 'style-transfer', name: 'Style Transfer', description: 'Repaint an image in a new style.', credits: 4 },
    ],
  },
  {
    id: 'convert',
    label: 'Convert',
    tools: [
      { slug: 'file-format', name: 'File Format', description: 'Convert between PNG, JPG, WebP, and more.', credits: 1 },
    ],
  },
];
