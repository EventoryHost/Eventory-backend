import { execSync } from "child_process";

function executeCommand(command) {
  try {
    execSync(command);
    return true;
  } catch {
    return false;
  }
}

function hasNoRelevantChanges() {
  return executeCommand(
    `git diff --quiet ${process.env.VERCEL_GIT_PREVIOUS_SHA} ${process.env.VERCEL_GIT_COMMIT_SHA}`,
  );
}

function hasNonDeployableChanges() {
  const changes = execSync(
    `git diff --name-only ${process.env.VERCEL_GIT_PREVIOUS_SHA} ${process.env.VERCEL_GIT_COMMIT_SHA}`,
  )
    .toString()
    .trim();
  return changes.split("\n").every((file) => /\.md$/.test(file));
}

function shouldSkipCommit() {
  const commitMessage = execSync("git log -1 --pretty=%B")
    .toString()
    .toLowerCase();
  return /\[skip ci\]|\[skip vercel\]|chore|wip/.test(commitMessage);
}

function notTargetBranch() {
  return process.env.VERCEL_ENV !== "production";
}

if (notTargetBranch() || shouldSkipCommit() || hasNoRelevantChanges() || hasNonDeployableChanges()) {
  process.exitCode = 0;
} else {
  process.exitCode = 1;
}
