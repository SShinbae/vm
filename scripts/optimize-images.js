const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// eslint-disable-next-line no-undef
const assetsDir = path.join(__dirname, "../assets/images");

const images = [
  {
    input: "vm_logo.png",
    outputs: ["vm_logo_optimized.png", "vm_logo.webp", "vm_logo_tiny.png"],
  },
  {
    input: "icon.png",
    outputs: ["icon_optimized.png", "icon.webp", "icon_tiny.png"],
  },
];

async function optimizeImages() {
  console.log("🖼️  Starting image optimization...\n");

  for (const { input, outputs } of images) {
    const inputPath = path.join(assetsDir, input);

    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${input} - file not found`);
      continue;
    }

    const stats = fs.statSync(inputPath);
    console.log(`📦 Original ${input}: ${(stats.size / 1024).toFixed(0)}KB`);

    try {
      // Create optimized PNG (quality 80)
      await sharp(inputPath)
        .png({ quality: 80, compressionLevel: 9 })
        .toFile(path.join(assetsDir, outputs[0]));

      const pngSize = fs.statSync(path.join(assetsDir, outputs[0])).size;
      console.log(
        `  ✅ ${outputs[0]}: ${(pngSize / 1024).toFixed(0)}KB (${((1 - pngSize / stats.size) * 100).toFixed(0)}% reduction)`,
      );

      // Create WebP (quality 85)
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(path.join(assetsDir, outputs[1]));

      const webpSize = fs.statSync(path.join(assetsDir, outputs[1])).size;
      console.log(
        `  ✅ ${outputs[1]}: ${(webpSize / 1024).toFixed(0)}KB (${((1 - webpSize / stats.size) * 100).toFixed(0)}% reduction)`,
      );

      // Create tiny placeholder (10x10 blur)
      await sharp(inputPath)
        .resize(10, 10)
        .blur(3)
        .png({ quality: 50 })
        .toFile(path.join(assetsDir, outputs[2]));

      const tinySize = fs.statSync(path.join(assetsDir, outputs[2])).size;
      console.log(
        `  ✅ ${outputs[2]}: ${(tinySize / 1024).toFixed(1)}KB (placeholder)\n`,
      );
    } catch (error) {
      console.error(`❌ Error optimizing ${input}:`, error.message);
    }
  }

  console.log("✨ Image optimization complete!\n");
  console.log("Next steps:");
  console.log("1. Backup originals if needed");
  console.log("2. Replace vm_logo.png with vm_logo_optimized.png");
  console.log("3. Replace icon.png with icon_optimized.png");
  console.log("4. Update Metro config for WebP support");
}

optimizeImages().catch(console.error);
