// lib/security.ts

export const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/,
  },
  {
    name: 'Stripe Secret Key',
    regex: /sk_(live|test)_[0-9a-zA-Z]{24}/,
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /ghp_[0-9a-zA-Z]{36}/,
  },
  {
    name: 'Generic API Key / Secret',
    // Looks for variables like API_KEY="xyz", SECRET='xyz', password = "xyz"
    regex: /(?:api[_-]?key|secret|password|token)\s*[:=]\s*(["'])(?:(?!\1).){16,}\1/i,
  },
  {
    name: 'RSA Private Key',
    regex: /-----BEGIN RSA PRIVATE KEY-----/,
  }
];

export function scanForSecrets(content: string, filePath: string): string[] {
  const foundSecrets: string[] = [];

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.regex.test(content)) {
      foundSecrets.push(`🚨 Warning: Potential ${pattern.name} found in \`${filePath}\``);
    }
  }

  return foundSecrets;
}