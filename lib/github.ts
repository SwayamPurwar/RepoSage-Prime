// lib/github.ts
import { Octokit } from '@octokit/rest' 
  import { redis } from './redis'

export function parseGitHubUrl(url: string): { owner: string; repo: string } { 
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/) 
  if (!match || !match[1] || !match[2]) throw new Error('Invalid GitHub URL') 
  return {  
    owner: match[1],  
    repo: match[2].replace('.git', '')  
  } 
} 
  
export async function getRepoInfo(owner: string, repo: string, token: string) { 
  const cacheKey = `repo_info:${owner}:${repo}`

  // 1. Check if the data is already in Redis
  const cachedData = await redis.get(cacheKey)
  if (cachedData) {
    return cachedData as any // Return instantly!
  }

  // 2. If not, fetch from GitHub
  const octokit = new Octokit({ auth: token }) 
  const { data } = await octokit.repos.get({ owner, repo }) 
  
  const repoData = { 
    name: data.name, 
    description: data.description, 
    language: data.language, 
    stars: data.stargazers_count, 
    url: data.html_url, 
    private: data.private,
  } 

  // 3. Save to Redis with an expiration of 1 hour (3600 seconds)
 await redis.set(cacheKey, repoData, { ex: 3600 })

  return repoData
}
export async function getRepoFiles( 
  owner: string, 
  repo: string,
  token: string,
  branch: string = 'HEAD'
): Promise<Array<{ path: string; content: string }>> { 
  const octokit = new Octokit({ auth: token }) 
  
  const { data: tree } = await octokit.git.getTree({ 
    owner, 
    repo, 
    tree_sha: branch,
    recursive: '1', 
  }) 
  
  const codeExtensions = [ 
    '.ts', '.tsx', '.js', '.jsx', '.py', '.java', 
    '.go', '.rs', '.cpp', '.c', '.cs', '.php', 
    '.rb', '.swift', '.kt', '.md', '.json', 
    '.yaml', '.yml', '.prisma', '.sql', 
    '.graphql', '.html', '.css', '.scss' 
  ] 
  
  const codeFiles = tree.tree.filter(file => 
    file.type === 'blob' && 
    file.path && 
    codeExtensions.some(ext => file.path!.endsWith(ext)) && 
    !file.path.includes('node_modules') && 
    !file.path.includes('.next') && 
    !file.path.includes('dist') && 
    !file.path.includes('package-lock.json') 
  ) 
  
  const filesWithContent: Array<{ path: string; content: string }> = [];
  const filesToFetch = codeFiles.slice(0, 50); 

  const batchSize = 5; 
  
  for (let i = 0; i < filesToFetch.length; i += batchSize) {
    const batch = filesToFetch.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (file) => {
      try {
        const { data } = await octokit.repos.getContent({ 
          owner, 
          repo, 
          path: file.path!, 
        });

        if ('content' in data && !Array.isArray(data)) { 
          const content = Buffer.from(data.content, 'base64').toString('utf-8');
          filesWithContent.push({ path: file.path!, content });
        }
      } catch (error) {
        console.warn(`Failed to fetch ${file.path}`);
      }
    }));
  }
  
  return filesWithContent;
}
// Add this to the bottom of lib/github.ts

export function parsePRUrl(url: string): { owner: string; repo: string; prNumber: number } {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
  if (!match || !match[1] || !match[2] || !match[3]) throw new Error('Invalid GitHub PR URL')
  return {
    owner: match[1],
    repo: match[2],
    prNumber: parseInt(match[3], 10)
  }
}

export async function postPRComment(
  owner: string,
  repo: string,
  issue_number: number,
  body: string,
  token: string
) {
  const octokit = new Octokit({ auth: token })
  // In the GitHub API, PRs are treated as issues for comments
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number,
    body
  })
}

// Add to lib/github.ts

export async function createPullRequestForFix(
  owner: string,
  repo: string,
  filePath: string,
  newContent: string,
  commitMessage: string,
  prTitle: string,
  prBody: string,
  token: string
) {
  const octokit = new Octokit({ auth: token });

  // 1. Get the default branch (usually 'main' or 'master')
  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  // 2. Get the SHA of the default branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });
  const baseSha = refData.object.sha;

  // 3. Create a new branch for the fix
  const branchName = `ai-fix/${filePath.replace(/[^a-zA-Z0-9-]/g, '-')}-${Date.now()}`;
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // 4. Get the file's current SHA (Required by GitHub to update an existing file)
  let fileSha: string | undefined = undefined;
  try {
    const { data: fileData } = await octokit.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref: branchName,
    });
    if ('sha' in fileData && !Array.isArray(fileData)) {
      fileSha = fileData.sha;
    }
  } catch (e) {
    console.warn("File not found or couldn't get SHA, assuming new file");
  }

  // 5. Commit the AI's new file content
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: filePath,
    message: commitMessage,
    content: Buffer.from(newContent).toString('base64'),
    branch: branchName,
    sha: fileSha,
  });

  // 6. Open the Pull Request
  const { data: prData } = await octokit.pulls.create({
    owner,
    repo,
    title: prTitle,
    body: prBody,
    head: branchName,
    base: defaultBranch,
  });

  return prData.html_url;
}