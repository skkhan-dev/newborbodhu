import { Storage } from "@google-cloud/storage";
import { promises as fs } from "node:fs";
import path from "node:path";

function parseGsUri(value: string) {
  const match = value.match(/^gs:\/\/([^/]+)\/?(.*)$/);

  if (!match) {
    throw new Error(`Invalid GCS URI: ${value}`);
  }

  return {
    bucketName: match[1],
    prefix: match[2].replace(/\/+$/, ""),
  };
}

async function main() {
  const sourceUri = process.argv[2];
  const targetDirArg = process.argv[3];

  if (!sourceUri || !targetDirArg) {
    throw new Error(
      "Usage: node download-gcs-prefix.js <gs://bucket/prefix> <targetDir>",
    );
  }

  const targetDir = path.resolve(targetDirArg);
  const { bucketName, prefix } = parseGsUri(sourceUri);
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const [files] = await bucket.getFiles({
    prefix: prefix ? `${prefix}/` : undefined,
  });

  if (!files.length) {
    throw new Error(`No files found under ${sourceUri}`);
  }

  let downloaded = 0;

  for (const file of files) {
    if (file.name.endsWith("/")) {
      continue;
    }

    const relative = prefix ? file.name.slice(prefix.length + 1) : file.name;
    const destination = path.join(targetDir, relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await file.download({ destination });
    downloaded += 1;

    if (downloaded % 5 === 0) {
      console.log(`Downloaded ${downloaded} files from ${sourceUri}...`);
    }
  }

  console.log(`Downloaded ${downloaded} files from ${sourceUri} to ${targetDir}.`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});
