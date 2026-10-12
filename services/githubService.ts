
import { TwinMetadata } from '../types';

export const DEFAULT_GITHUB_TOKEN = (import.meta.env && import.meta.env.VITE_GITHUB_TOKEN) ? import.meta.env.VITE_GITHUB_TOKEN : '';

export const createGitHubPR = async (repo: string, token: string, title: string, body: string, metadata?: TwinMetadata) => {
  const activeToken = token && !token.includes('github_pat_YOUR_TOKEN_HERE') && token.trim() !== 'github_pat_'
    ? token
    : (import.meta.env.VITE_GITHUB_TOKEN || DEFAULT_GITHUB_TOKEN);

  if (!activeToken || activeToken.includes('github_pat_YOUR_TOKEN_HERE') || activeToken.trim() === 'github_pat_') {
    throw new Error("Valid GitHub Personal Access Token (PAT) required. Please update in Admin Settings.");
  }

  const fetchWithTimeout = async (url: string, options: any = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(id);
    }
  };

  try {
    // 1. Get the default branch (usually main)
    const repoRes = await fetchWithTimeout(`https://api.github.com/repos/${repo}`, {
      headers: { 'Authorization': `token ${activeToken}` }
    });
    if (!repoRes.ok) throw new Error("Failed to fetch repository info. Check your token and repo path.");
    const repoData = await repoRes.json();
    const baseBranch = repoData.default_branch;

    // 2. Create a standardized daily backup branch name
    const dateStr = new Date().toISOString().split('T')[0];
    const branchName = `civic-twin-backup-${dateStr}-${Date.now().toString().slice(-4)}`;
    
    // 3. Get the SHA of the base branch
    const refRes = await fetchWithTimeout(`https://api.github.com/repos/${repo}/git/refs/heads/${baseBranch}`, {
      headers: { 'Authorization': `token ${activeToken}` }
    });
    if (!refRes.ok) throw new Error("Failed to fetch default branch reference.");
    const refData = await refRes.json();
    const baseSha = refData.object.sha;

    // 4. Create the new backup branch
    const createBranchRes = await fetchWithTimeout(`https://api.github.com/repos/${repo}/git/refs`, {
      method: 'POST',
      headers: { 
        'Authorization': `token ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha
      })
    });
    if (!createBranchRes.ok) throw new Error("Failed to create branch. Ensure your token has 'repo' permissions.");

    // 5. Create/Update the manifest snapshot file
    const manifestData = {
      backupDate: dateStr,
      lastUpdate: new Date().toISOString(),
      status: "Backed up via Civic Twin Daily Architect",
      repository: repo,
      branch: baseBranch,
      version: metadata?.version || "0.7.0",
      instance: metadata?.name || "Civic Twin Core",
      plugin: {
        name: "Civic_Twin_Angel_Sharks_ap.V.07",
        version: "0.7.0",
        archiveFile: "Civic_Twin_Angel_Sharks_ap.V.07.zip",
        increment: 0.01,
        targetCity: "City of Santa Barbara, CA",
        targetWebsite: "https://santabarbaraca.gov/",
        syncStatus: "synchronized"
      },
      config: metadata || {}
    };
    
    const fileContent = btoa(JSON.stringify(manifestData, null, 2));
    
    // Check if file exists to get its SHA (required for updates)
    let fileSha: string | undefined;
    const checkFileRes = await fetchWithTimeout(`https://api.github.com/repos/${repo}/contents/civic-twin-manifest.json?ref=${baseBranch}`, {
      headers: { 'Authorization': `token ${activeToken}` }
    });
    
    if (checkFileRes.ok) {
      const fileData = await checkFileRes.json();
      fileSha = fileData.sha;
    }

    await fetchWithTimeout(`https://api.github.com/repos/${repo}/contents/civic-twin-manifest.json`, {
      method: 'PUT',
      headers: { 
        'Authorization': `token ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore: update civic twin manifest for ${metadata?.name || 'instance'} (V.07)`,
        content: fileContent,
        branch: branchName,
        sha: fileSha
      })
    });

    // 6. Create the PR
    const prRes = await fetchWithTimeout(`https://api.github.com/repos/${repo}/pulls`, {
      method: 'POST',
      headers: { 
        'Authorization': `token ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: metadata?.version ? `[${metadata.version}] ${title}` : title,
        body,
        head: branchName,
        base: baseBranch
      })
    });

    if (!prRes.ok) {
      const errorData = await prRes.json();
      throw new Error(errorData.message || "Failed to create Pull Request");
    }

    return await prRes.json();
  } catch (error: any) {
    console.error("GitHub PR Error:", error);
    throw error;
  }
};
