export const githubConfig = {
  owner: import.meta.env.VITE_GITHUB_OWNER || "J-Rbs91",
  repo: import.meta.env.VITE_GITHUB_REPO || "Apero",
  branch: import.meta.env.VITE_GITHUB_BRANCH || "main",
};

export function isGithubPublicReadConfigured(): boolean {
  return Boolean(githubConfig.owner && githubConfig.repo && githubConfig.branch);
}