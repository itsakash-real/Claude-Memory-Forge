export const PRESETS = {
  react: {
    identity: {
      role: 'React Frontend Developer',
      claudeUsage: 'I use Claude to build accessible, high-performance React components using Next.js and typical modern tools Context, state management, and CSS.',
      devLevel: 'intermediate',
      bio: 'I prefer functional components, React Hooks, and clean architecture. Warn me about accessibility issues and performance regressions.'
    },
    tools: {
      os: 'macOS',
      editor: 'VS Code',
      term: 'iTerm2 + zsh',
      primaryLanguage: 'JavaScript / TypeScript',
      tools: 'React, Next.js, Node.js, Vercel, Git',
      integrations: ['email', 'calendar', 'slack', 'apple']
    },
    people: {
      people: [
        { name: 'Sarah', role: 'Lead Designer', company: '', relationship: 'colleague', notes: 'Provides me with Figma designs.' }
      ]
    },
    projects: {
      projects: [
        { name: 'Web App', path: 'src/', description: 'Main user-facing web application built with React.', isMain: true }
      ]
    },
    clients: { clients: [] },
    preferences: {
      wantsDashboard: true,
      preferences: [
        { detail: 'Always use functional components and hooks instead of class components.' },
        { detail: 'Prioritize Tailwind CSS (if installed) or standard CSS Modules for styling.' },
        { detail: 'Include propTypes or TypeScript interfaces for new components.' }
      ]
    },
    glossary: {
      terms: [
        { term: 'A11y', definition: 'Accessibility. Must be standard on all interactive components.' }
      ]
    }
  },
  dataScience: {
    identity: {
      role: 'Data Scientist',
      claudeUsage: 'I use Claude for writing Python data processing scripts, training machine learning models with PyTorch/Scikit-learn, and generating Jupyter notebooks.',
      devLevel: 'advanced',
      bio: 'Skip boilerplate explanations. Give me optimized NumPy/Pandas code. Focus on readability and vectorized operations.'
    },
    tools: {
      os: 'Linux (Ubuntu)',
      editor: 'Jupyter Notebook / PyCharm',
      term: 'bash',
      primaryLanguage: 'Python, SQL',
      tools: 'Pandas, NumPy, Scikit-learn, PyTorch, Matplotlib',
      integrations: ['email', 'calendar']
    },
    people: { people: [] },
    projects: {
      projects: [
        { name: 'ML Pipeline', path: 'notebooks/', description: 'Data exploration and model training notebooks.', isMain: true },
        { name: 'Scripts', path: 'scripts/', description: 'Python scripts for ETL processes.', isMain: false }
      ]
    },
    clients: { clients: [] },
    preferences: {
      wantsDashboard: false,
      preferences: [
        { detail: 'Use vectorized operations in Pandas/NumPy instead of loops whenever possible.' },
        { detail: 'Include docstrings format (Google style) for Python functions.' },
        { detail: 'Show progress bars (tqdm) for long-running processes.' }
      ]
    },
    glossary: {
      terms: [
        { term: 'ETL', definition: 'Extract, Transform, Load processes.' }
      ]
    }
  },
  devOps: {
    identity: {
      role: 'DevOps Engineer',
      claudeUsage: 'I use Claude for writing Dockerfiles, Kubernetes manifests, CI/CD pipelines (GitHub Actions), and Terraform scripts.',
      devLevel: 'advanced',
      bio: 'Prioritize security and immutability. Give me copy-pasteable YAML and shell scripts.'
    },
    tools: {
      os: 'Linux',
      editor: 'Vim',
      term: 'bash',
      primaryLanguage: 'Go, Bash',
      tools: 'Docker, Kubernetes, AWS, Terraform, GitHub Actions',
      integrations: ['email', 'calendar', 'slack']
    },
    people: { people: [] },
    projects: {
      projects: [
        { name: 'Infrastructure', path: 'terraform/', description: 'IaC for cloud resources.', isMain: true },
        { name: 'Manifests', path: 'k8s/', description: 'Kubernetes deployment configurations.', isMain: false }
      ]
    },
    clients: { clients: [] },
    preferences: {
      wantsDashboard: true,
      preferences: [
        { detail: 'Always enforce least privilege principles in IAM policies or Docker user contexts.' },
        { detail: 'Ensure bash scripts have strict error handling (set -eou pipefail).' },
        { detail: 'Prefer declarative infrastructure over imperative commands.' }
      ]
    },
    glossary: { terms: [] }
  }
};
