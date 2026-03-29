// lib/github.ts
import { Octokit } from '@octokit/rest' 
  
export function parseGitHubUrl(url: string): {  
  owner: string; repo: string  
} { 
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/) 
  if (!match) throw new Error('Invalid GitHub URL') 
  return {  
    owner: match[1],  
    repo: match[2].replace('.git', '')  
  } 
} 
  
export async function getRepoInfo(owner: string, repo: string, token: string) { 
  const octokit = new Octokit({ auth: token }) 
  const { data } = await octokit.repos.get({ owner, repo }) 
  return { 
    name: data.name, 
    description: data.description, 
    language: data.language, 
    stars: data.stargazers_count, 
    url: data.html_url, 
    private: data.private,
  } 
} 
  
export async function getRepoFiles( 
  owner: string, 
  repo: string,
  token: string
): Promise<Array<{ path: string; content: string }>> { 
  const octokit = new Octokit({ auth: token }) 
  
  const { data: tree } = await octokit.git.getTree({ 
    owner, 
    repo, 
    tree_sha: 'HEAD', 
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