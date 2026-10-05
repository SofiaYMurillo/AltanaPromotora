/**
 * DISABLED — color/luminance background removal destroys white architectural
 * surfaces on the About hero maquette (walls are not background).
 *
 * About hero uses the user-provided PNG at public/images/about/about-house-hero.png
 * as-is (externally prepared transparency). Do not run white-keying on it.
 */
console.error(
  "process-about-house-alpha.mjs is disabled: white-key background removal is not valid for the About maquette.",
);
process.exit(1);
