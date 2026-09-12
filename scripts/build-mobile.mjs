import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  VITE_BASE_PATH: "./",
  VITE_DISABLE_PWA: "true"
};

function run(command) {
  const result = spawnSync(command, { shell: true, stdio: "inherit", env });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run("pnpm build");
run("pnpm exec cap sync android");