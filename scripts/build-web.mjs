import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(projectRoot, "www");
const vendorDirectory = path.join(outputDirectory, "vendor");
const webAssetPattern = /\.(?:html|css|js|webmanifest|jpe?g|png|webp|gif|svg)$/i;

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await mkdir(vendorDirectory, { recursive: true });

const entries = await readdir(projectRoot, { withFileTypes: true });
const assets = entries
  .filter(entry => entry.isFile() && webAssetPattern.test(entry.name))
  .map(entry => entry.name)
  .sort();

await Promise.all(
  assets.map(asset =>
    copyFile(path.join(projectRoot, asset), path.join(outputDirectory, asset))
  )
);

await copyFile(
  path.join(projectRoot, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"),
  path.join(vendorDirectory, "supabase.js")
);

console.log(`Copied ${assets.length} web assets and the Supabase client to www/.`);
