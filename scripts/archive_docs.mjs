import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module dirname setting
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
// Current Brain ID: ecee6cea-7f29-42cb-88b9-850ad4b54a6f
const ARTIFACT_DIR =
  "C:/Users/JiYeong/.gemini/antigravity/brain/ecee6cea-7f29-42cb-88b9-850ad4b54a6f";
// Using 'doc' to match the existing folder structure and user rules
const DOCS_DIR = path.resolve(__dirname, "../doc");
const TARGET_FILES = ["task.md", "implementation_plan.md", "walkthrough.md"];

// Ensure docs directory exists
if (!fs.existsSync(DOCS_DIR)) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });
  console.log(`📂 Created directory: ${DOCS_DIR}`);
}

const getTimestamp = () => {
  return new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const divider = (filename, timestamp) => `

---
# 📅 Archive Updated: ${timestamp}
# 📄 File: ${filename}
---

`;

async function archiveDocs() {
  console.log("🚀 Starting documentation archival...");

  for (const file of TARGET_FILES) {
    const srcPath = path.join(ARTIFACT_DIR, file);
    const destPath = path.join(DOCS_DIR, file);

    try {
      if (fs.existsSync(srcPath)) {
        const content = fs.readFileSync(srcPath, "utf-8");
        const timestamp = getTimestamp();

        let writeMode = "Created";
        if (fs.existsSync(destPath)) {
          // Append with divider
          const appendContent = divider(file, timestamp) + content;
          fs.appendFileSync(destPath, appendContent, "utf-8");
          writeMode = "Appended";
        } else {
          // Create new
          const initialContent =
            `# ${file} Archive\n` + divider(file, timestamp) + content;
          fs.writeFileSync(destPath, initialContent, "utf-8");
        }

        console.log(`✅ ${writeMode}: ${file}`);
      } else {
        console.warn(`⚠️  Source file not found (Brain): ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }

  console.log("✨ Archival process complete.");
}

archiveDocs();
