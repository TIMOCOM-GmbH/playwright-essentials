// Commitlint configuration (CJS)
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': [2, 'always', 100],
    // Allow long lines in commit body to avoid CI failures (CHANGELOG snippets, links, etc.)
    'body-max-line-length': [0, 'always'],
  },
  // Ignore semantic-release commit messages like "chore(release): 1.0.0 [skip ci]"
  ignores: [message => /chore\(release\): \d+\.\d+\.\d+/.test(message)],
}
