import { readFileSync, existsSync, mkdirSync, copyFileSync } from "fs";
import { join, resolve } from "path";

function loadEnv() {
    const envPath = resolve(".", ".env");
    if (!existsSync(envPath)) return;
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;
            const eqIndex = trimmed.indexOf("=");
            if (eqIndex === -1) continue;
            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();
            if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
            }
            if (!process.env[key]) {
                    process.env[key] = value;
            }
    }
}

export function copyToVault() {
    loadEnv();

    const vaultPath = process.env.OBSIDIAN_VAULT;
    if (!vaultPath) {
            console.error("OBSIDIAN_VAULT is not set. Create a .env file with OBSIDIAN_VAULT=/path/to/vault");
            return false;
    }

    const pluginsDir = join(vaultPath, ".obsidian", "plugins");
    if (!existsSync(pluginsDir)) {
            console.error(`Plugins directory does not exist: ${pluginsDir}`);
            return false;
    }

    const manifestPath = "manifest.json";
    if (!existsSync(manifestPath)) {
            console.error(`manifest.json not found. Run 'npm run build' first to generate it.`);
            return false;
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const destDir = join(pluginsDir, manifest.id);

    mkdirSync(destDir, { recursive: true });

    const filesToCopy = [
            { src: "main.js",       dest: join(destDir, "main.js") },
            { src: "manifest.json", dest: join(destDir, "manifest.json") },
            { src: "styles.css",    dest: join(destDir, "styles.css") },
    ];

    for (const { src, dest } of filesToCopy) {
            if (existsSync(src)) {
                    copyFileSync(src, dest);
                    console.log(`Copied ${src} → ${dest}`);
            } else {
                    console.warn(`Skipping ${src} (not found)`);
            }
    }

    return true;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve("lib/copy-to-vault.mjs")) {
    if (!copyToVault()) process.exit(1);
}