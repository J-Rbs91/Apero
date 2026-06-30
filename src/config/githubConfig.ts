/*
 * ATTENTION: this frontend-only experiment exposes the GitHub token in the
 * browser bundle. This is intentionally unsafe and only acceptable for a
 * throwaway, public, non-sensitive joke project.
 */
export const githubConfig = {
  owner: import.meta.env.VITE_GITHUB_OWNER || "J-Rbs91",
  repo: import.meta.env.VITE_GITHUB_REPO || "Apero",
  branch: import.meta.env.VITE_GITHUB_BRANCH || "main",
  dataPath: import.meta.env.VITE_GITHUB_DATA_PATH || "data/events",
  token: import.meta.env.VITE_GITHUB_TOKEN || "",
};

export function isGithubStorageConfigured(): boolean {
  return Boolean(
    githubConfig.owner &&
      githubConfig.repo &&
      githubConfig.branch &&
      githubConfig.dataPath &&
      githubConfig.token,
  );
}
