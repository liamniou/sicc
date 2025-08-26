#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { generateStaticSite, CONFIG } = require('./generate-static.js');

// Configuration
const DEPLOY_CONFIG = {
  ...CONFIG,
  branch: 'gh-pages',
  remote: 'origin',
  commitMessage: `Deploy static site - ${new Date().toISOString()}`,
};

function runCommand(command, options = {}) {
  console.log(`🔧 Running: ${command}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options 
    });
    return result;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkGitStatus() {
  console.log('📋 Checking git status...');
  
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    if (status.trim()) {
      console.warn('⚠️  Working directory is not clean. Uncommitted changes:');
      console.log(status);
      
      const answer = process.env.FORCE_DEPLOY || 'no';
      if (answer.toLowerCase() !== 'yes') {
        console.log('💡 Commit your changes first, or set FORCE_DEPLOY=yes to continue anyway.');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('❌ Failed to check git status');
    process.exit(1);
  }
}

function setupGitConfig() {
  console.log('⚙️  Setting up git configuration...');
  
  // Check if we're in a CI environment
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    console.log('🤖 Detected CI environment, setting up git user...');
    
    const gitEmail = process.env.GIT_EMAIL || 'action@github.com';
    const gitName = process.env.GIT_NAME || 'GitHub Action';
    
    runCommand(`git config --global user.email "${gitEmail}"`);
    runCommand(`git config --global user.name "${gitName}"`);
  }
}

function deployToGitHubPages() {
  console.log('🚀 Starting GitHub Pages deployment...');
  
  // Step 1: Check git status
  if (!process.env.SKIP_GIT_CHECK) {
    checkGitStatus();
  }
  
  // Step 2: Setup git config for CI
  setupGitConfig();
  
  // Step 3: Generate static site
  console.log('📦 Generating static site...');
  generateStaticSite();
  
  // Step 4: Check if static site was generated
  if (!fs.existsSync(CONFIG.outputDir)) {
    console.error('❌ Static site directory not found!');
    process.exit(1);
  }
  
  // Step 5: Initialize or update gh-pages branch
  console.log('🌟 Setting up gh-pages branch...');
  
  // Save current branch
  const currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  console.log(`📌 Current branch: ${currentBranch}`);
  
  // Check if gh-pages branch exists
  let branchExists = false;
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${DEPLOY_CONFIG.branch}`, { stdio: 'ignore' });
    branchExists = true;
  } catch (error) {
    console.log(`📝 Branch ${DEPLOY_CONFIG.branch} doesn't exist, will create it.`);
  }
  
  // Create temporary directory for deployment
  const tempDir = path.join(process.cwd(), '.deploy-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);
  
  try {
    // Copy static site to temp directory
    runCommand(`cp -r "${CONFIG.outputDir}"/* "${tempDir}/"`);
    
    // Switch to or create gh-pages branch
    if (branchExists) {
      runCommand(`git checkout ${DEPLOY_CONFIG.branch}`);
      // Remove all existing files
      runCommand('git rm -rf .', { stdio: 'ignore' });
    } else {
      // Create orphan branch
      runCommand(`git checkout --orphan ${DEPLOY_CONFIG.branch}`);
      runCommand('git rm -rf .', { stdio: 'ignore' });
    }
    
    // Copy files from temp directory
    runCommand(`cp -r "${tempDir}"/* ./`);
    runCommand(`cp "${tempDir}"/.[^.]* ./ 2>/dev/null || true`);
    
    // Add all files
    runCommand('git add .');
    
    // Check if there are any changes to commit
    try {
      execSync('git diff --staged --quiet');
      console.log('📭 No changes to deploy.');
    } catch (error) {
      // There are changes, commit them
      runCommand(`git commit -m "${DEPLOY_CONFIG.commitMessage}"`);
      
      // Push to remote
      console.log('📤 Pushing to GitHub...');
      runCommand(`git push ${DEPLOY_CONFIG.remote} ${DEPLOY_CONFIG.branch}`);
      
      console.log('🎉 Deployment successful!');
      
      // Get repository URL for GitHub Pages
      try {
        const remoteUrl = execSync(`git remote get-url ${DEPLOY_CONFIG.remote}`, { encoding: 'utf-8' }).trim();
        const match = remoteUrl.match(/github\.com[:/](.+)\.git$/);
        if (match) {
          const repoPath = match[1];
          console.log(`🌐 Your site will be available at: https://${repoPath.split('/')[0]}.github.io/${repoPath.split('/')[1]}/`);
        }
      } catch (error) {
        console.log('🌐 Your site should be available at your GitHub Pages URL');
      }
    }
    
    // Switch back to original branch
    runCommand(`git checkout ${currentBranch}`);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    
    // Try to switch back to original branch
    try {
      runCommand(`git checkout ${currentBranch}`);
    } catch (checkoutError) {
      console.error('❌ Failed to switch back to original branch');
    }
    
    process.exit(1);
  } finally {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

// Handle command line arguments
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
GitHub Pages Deployment Script

Usage:
  node deploy-to-github-pages.js [options]

Options:
  --help, -h          Show this help message
  --force             Skip git status check
  --base-url <url>    Set base URL for GitHub Pages

Environment Variables:
  GITHUB_PAGES_BASE_URL   Base URL for the site
  FORCE_DEPLOY=yes        Skip git status check
  SKIP_GIT_CHECK=true     Skip git status check
  GIT_EMAIL               Git user email (for CI)
  GIT_NAME                Git user name (for CI)

Examples:
  node deploy-to-github-pages.js
  FORCE_DEPLOY=yes node deploy-to-github-pages.js
  GITHUB_PAGES_BASE_URL=/my-repo node deploy-to-github-pages.js
    `);
    return;
  }
  
  if (args.includes('--force')) {
    process.env.FORCE_DEPLOY = 'yes';
  }
  
  const baseUrlIndex = args.indexOf('--base-url');
  if (baseUrlIndex !== -1 && args[baseUrlIndex + 1]) {
    process.env.GITHUB_PAGES_BASE_URL = args[baseUrlIndex + 1];
  }
  
  deployToGitHubPages();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { deployToGitHubPages };
