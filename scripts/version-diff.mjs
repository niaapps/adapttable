/** Share content-verified release classification between CI and local gates. */
import { execFileSync } from "node:child_process";

import { gitBinary } from "./git-binary.mjs";
import { isVersionMetadata, VERSION_METADATA } from "./version-lockfile.mjs";

export function verifiedVersionDiff(
  files,
  { base, head = "HEAD", cwd = process.cwd() } = {}
) {
  if (!base || !files.every((file) => VERSION_METADATA.test(file)))
    return false;
  const read = (revision) => (file) =>
    execFileSync(gitBinary(), ["show", `${revision}:${file}`], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  return isVersionMetadata(files, read(base), read(head));
}
