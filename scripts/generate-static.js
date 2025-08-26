#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration - detect if we're running from root or chaibuilder-nextjs directory
const isInChaiBuilderDir = process.cwd().endsWith('chaibuilder-nextjs');
const rootDir = isInChaiBuilderDir ? path.join(process.cwd(), '..') : process.cwd();
const chaiBuilderDir = isInChaiBuilderDir ? process.cwd() : path.join(process.cwd(), 'chaibuilder-nextjs');

const CONFIG = {
  chaiDir: path.join(chaiBuilderDir, 'chai'),
  publicDir: path.join(chaiBuilderDir, 'public'),
  outputDir: path.join(rootDir, 'static-site'),
  baseUrl: process.env.GITHUB_PAGES_BASE_URL || '',
};

// Helper function to read and parse .chai files
function readChaiFile(filename) {
  const filePath = path.join(CONFIG.chaiDir, filename);
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File ${filename} not found`);
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    return [];
  }
}

// Function to inject global blocks
function injectGlobalBlocks(blocks) {
  const processedBlocks = [...blocks];
  
  for (let i = 0; i < processedBlocks.length; i++) {
    const block = processedBlocks[i];
    
    if (block._type === 'GlobalBlock' && block.globalBlock) {
      console.log(`Injecting global block: ${block.globalBlock}`);
      
      // Read the global block file
      const globalBlocks = readChaiFile(`${block.globalBlock}.global.chai`);
      
      if (globalBlocks.length > 0) {
        // Replace the GlobalBlock with the actual global blocks
        processedBlocks.splice(i, 1, ...globalBlocks);
        i += globalBlocks.length - 1; // Adjust index for added blocks
      }
    }
  }
  
  return processedBlocks;
}

// Function to convert ChaiBuilder blocks to HTML
function renderChaiBlocksToHTML(blocks, pageName) {
  // Filter out metadata blocks
  const contentBlocks = blocks.filter(block => 
    !block._type.startsWith('@chai/')
  );
  
  // Build a tree structure from flat blocks
  const tree = buildBlockTree(contentBlocks);
  
  // Basic HTML structure
  const htmlParts = [];
  
  // Add DOCTYPE and basic structure
  htmlParts.push('<!DOCTYPE html>');
  htmlParts.push('<html lang="en" class="light">');
  htmlParts.push('<head>');
  htmlParts.push('  <meta charset="UTF-8">');
  htmlParts.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  htmlParts.push('  <title>SICC - Stockholm International Cinema Collective</title>');
  htmlParts.push('  <script src="https://cdn.tailwindcss.com"></script>');
  htmlParts.push('  <script>');
  htmlParts.push('    tailwind.config = {');
  htmlParts.push('      theme: {');
  htmlParts.push('        extend: {');
  htmlParts.push('          colors: {');
  htmlParts.push('            primary: {');
  htmlParts.push('              50: "#f3f0ff",');
  htmlParts.push('              100: "#e9e2ff",');
  htmlParts.push('              200: "#d6ccff",');
  htmlParts.push('              300: "#b8a5ff",');
  htmlParts.push('              400: "#9572ff",');
  htmlParts.push('              500: "#570df8",');
  htmlParts.push('              600: "#4c0de0",');
  htmlParts.push('              700: "#3d0bb8",');
  htmlParts.push('              800: "#320996",');
  htmlParts.push('              900: "#280777"');
  htmlParts.push('            },');
  htmlParts.push('            secondary: {');
  htmlParts.push('              500: "#f002b8"');
  htmlParts.push('            }');
  htmlParts.push('          }');
  htmlParts.push('        }');
  htmlParts.push('      }');
  htmlParts.push('    }');
  htmlParts.push('  </script>');
  htmlParts.push('  <link rel="preconnect" href="https://fonts.googleapis.com">');
  htmlParts.push('  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>');
  htmlParts.push('  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">');
  htmlParts.push('  <script defer src="https://cloud.umami.is/script.js" data-website-id="fa338ebd-8956-48ed-b328-d5010cbff5ef"></script>');
  htmlParts.push('  <style>');
  htmlParts.push('    body { font-family: "Poppins", sans-serif; }');
  htmlParts.push('    .font-geist-sans { font-family: "Poppins", sans-serif; }');
  htmlParts.push('    .font-geist-mono { font-family: "Poppins", monospace; }');
  htmlParts.push('  </style>');
  htmlParts.push('</head>');
  htmlParts.push('<body class="antialiased bg-gray-50 dark:bg-gray-900">');
  
  // Render the tree structure
  tree.forEach(rootBlock => {
    htmlParts.push(renderBlockTree(rootBlock));
  });
  
  // Add Preline script if needed
  htmlParts.push('  <script src="https://preline.co/assets/js/hs-ui.bundle.js"></script>');
  htmlParts.push('</body>');
  htmlParts.push('</html>');
  
  return htmlParts.join('\n');
}

// Function to build a tree structure from flat blocks
function buildBlockTree(blocks) {
  const blockMap = {};
  const roots = [];
  
  // Create a map of all blocks by ID
  blocks.forEach(block => {
    blockMap[block._id] = { ...block, children: [] };
  });
  
  // Build parent-child relationships
  blocks.forEach(block => {
    if (block._parent && blockMap[block._parent]) {
      blockMap[block._parent].children.push(blockMap[block._id]);
    } else {
      // Root level blocks (no parent or parent doesn't exist)
      roots.push(blockMap[block._id]);
    }
  });
  
  return roots;
}

// Function to render a block tree (with children)
function renderBlockTree(blockNode, parentType = null) {
  const block = blockNode;
  let html = '';
  
  // Render the current block
  if (block._type && !block._type.startsWith('@chai/')) {
    const blockContent = renderBlockWithChildren(block, parentType);
    html += blockContent;
  }
  
  return html;
}

// Function to render a block and its children
function renderBlockWithChildren(block, parentType = null) {
  if (!block._type) return '';
  
  let html = '';
  let childrenHTML = '';
  
  // Render all children first, passing current block type as parent context
  if (block.children && block.children.length > 0) {
    block.children.forEach(child => {
      childrenHTML += renderBlockWithChildren(child, block._type);
    });
  }
  
  // Render the block based on its type
  switch (block._type) {
    case 'Box':
      html = renderBoxWithChildren(block, childrenHTML);
      break;
    case 'Heading':
      html = childrenHTML ? renderHeadingWithChildren(block, childrenHTML) : renderHeading(block);
      break;
    case 'Paragraph':
      html = renderParagraph(block);
      break;
    case 'Text':
      html = renderText(block, parentType);
      break;
    case 'Link':
      html = renderLinkWithChildren(block, childrenHTML);
      break;
    case 'Image':
      html = renderImage(block);
      break;
    case 'Button':
      html = renderButton(block, parentType);
      break;
    case 'Span':
      html = renderSpan(block);
      break;
    case 'Divider':
      html = renderDivider(block);
      break;
    case 'CustomHTML':
      html = renderCustomHTML(block);
      break;
    case 'Card':
      html = renderCard(block);
      break;
    default:
      console.warn(`Unknown block type: ${block._type}`);
      html = childrenHTML; // Just render children if we don't know the block type
      break;
  }
  
  return html;
}

// Function to render individual blocks
function renderBlock(block) {
  if (!block._type) return '';
  
  switch (block._type) {
    case 'Box':
      return renderBox(block);
    case 'Heading':
      return renderHeading(block);
    case 'Paragraph':
      return renderParagraph(block);
    case 'Text':
      return renderText(block);
    case 'Link':
      return renderLink(block);
    case 'Image':
      return renderImage(block);
    case 'Button':
      return renderButton(block);
    case 'Span':
      return renderSpan(block);
    case 'Divider':
      return renderDivider(block);
    case 'CustomHTML':
      return renderCustomHTML(block);
    case 'Card':
      return renderCard(block);
    default:
      console.warn(`Unknown block type: ${block._type}`);
      return '';
  }
}

function parseChaiStyles(styleString) {
  if (!styleString || !styleString.startsWith('#styles:')) return '';
  
  // Extract classes from #styles:prefix,classes format
  const withoutPrefix = styleString.replace('#styles:', '');
  const parts = withoutPrefix.split(',');
  
  // If there are multiple parts, take everything after the first comma
  // The first part is usually empty or contains prefixes
  const classString = parts.length > 1 ? parts.slice(1).join(',') : withoutPrefix;
  
  return classString.trim();
}

function renderBox(block) {
  const classes = parseChaiStyles(block.styles);
  const tag = block.tag || 'div';
  const attrs = block.styles_attrs || {};
  
  let attributeString = '';
  Object.entries(attrs).forEach(([key, value]) => {
    // Handle Alpine.js attributes
    if (key.startsWith(':') || key.startsWith('x-') || key.startsWith('@')) {
      attributeString += ` ${key}="${value}"`;
    } else {
      attributeString += ` ${key}="${value}"`;
    }
  });
  
  return `<${tag} class="${classes}"${attributeString}></${tag}>`;
}

function renderBoxWithChildren(block, childrenHTML) {
  const classes = parseChaiStyles(block.styles);
  const tag = block.tag || 'div';
  const attrs = block.styles_attrs || {};
  
  let attributeString = '';
  Object.entries(attrs).forEach(([key, value]) => {
    // Handle Alpine.js attributes
    if (key.startsWith(':') || key.startsWith('x-') || key.startsWith('@')) {
      attributeString += ` ${key}="${value}"`;
    } else {
      attributeString += ` ${key}="${value}"`;
    }
  });
  
  return `<${tag} class="${classes}"${attributeString}>${childrenHTML}</${tag}>`;
}

function renderHeading(block) {
  const classes = parseChaiStyles(block.styles);
  const level = block.level || 'h1';
  const content = block.content || '';
  
  return `<${level} class="${classes}">${content}</${level}>`;
}

// Function to render heading with children (for nested text content)
function renderHeadingWithChildren(block, childrenHTML) {
  const classes = parseChaiStyles(block.styles);
  const level = block.level || 'h1';
  const content = block.content || '';
  
  // If there are children (typically Text elements), use them instead of the heading content
  const finalContent = childrenHTML.trim() ? childrenHTML : content;
  
  return `<${level} class="${classes}">${finalContent}</${level}>`;
}

function renderParagraph(block) {
  const classes = parseChaiStyles(block.styles);
  const content = block.content || '';
  
  return `<p class="${classes}">${content}</p>`;
}

function renderLink(block) {
  const classes = parseChaiStyles(block.styles);
  const href = block.link?.href || '#';
  const target = block.link?.target || '_self';
  const content = block.content || '';
  const attrs = block.styles_attrs || {};
  
  let attributeString = '';
  Object.entries(attrs).forEach(([key, value]) => {
    attributeString += ` ${key}="${value}"`;
  });
  
  // Convert internal links to proper paths for static site
  let processedHref = href;
  if (href.startsWith('/') && href !== '/') {
    // Convert /about to /about/index.html for GitHub Pages
    processedHref = `${CONFIG.baseUrl}${href}/index.html`;
  } else if (href === '/') {
    processedHref = `${CONFIG.baseUrl}/index.html`;
  }
  
  return `<a href="${processedHref}" target="${target}" class="${classes}"${attributeString}>${content}</a>`;
}

function renderLinkWithChildren(block, childrenHTML) {
  const classes = parseChaiStyles(block.styles);
  const href = block.link?.href || '#';
  const target = block.link?.target || '_self';
  const content = block.content || '';
  const attrs = block.styles_attrs || {};
  
  let attributeString = '';
  Object.entries(attrs).forEach(([key, value]) => {
    attributeString += ` ${key}="${value}"`;
  });
  
  // Convert internal links to proper paths for static site
  let processedHref = href;
  if (href.startsWith('/') && href !== '/') {
    // Convert /about to /about/index.html for GitHub Pages
    processedHref = `${CONFIG.baseUrl}${href}/index.html`;
  } else if (href === '/') {
    processedHref = `${CONFIG.baseUrl}/index.html`;
  }
  
  // Use children content if available, otherwise use block content
  const linkContent = childrenHTML || content;
  
  return `<a href="${processedHref}" target="${target}" class="${classes}"${attributeString}>${linkContent}</a>`;
}

function renderImage(block) {
  const classes = parseChaiStyles(block.styles);
  const src = block.image || '';
  const alt = block.alt || '';
  const width = block.width || '';
  const height = block.height || '';
  
  let attributeString = '';
  if (width) attributeString += ` width="${width}"`;
  if (height) attributeString += ` height="${height}"`;
  if (block.lazyLoading) attributeString += ' loading="lazy"';
  
  return `<img src="${src}" alt="${alt}" class="${classes}"${attributeString}>`;
}

function renderButton(block, parentType = null) {
  const classes = parseChaiStyles(block.styles);
  const content = block.content || '';
  
  // Just use the text content, no icons
  const buttonContent = content;
  
  // If the button is inside a Link, render as div to avoid invalid HTML (button inside a)
  if (parentType === 'Link') {
    return `<div class="${classes}">${buttonContent}</div>`;
  } else {
    return `<button class="${classes}">${buttonContent}</button>`;
  }
}

function renderSpan(block) {
  const classes = parseChaiStyles(block.styles);
  const content = block.content || '';
  
  return `<span class="${classes}">${content}</span>`;
}

function renderDivider(block) {
  const classes = parseChaiStyles(block.styles);
  
  return `<hr class="${classes}">`;
}

function renderText(block, parentType = null) {
  const classes = parseChaiStyles(block.styles);
  const content = block.content || '';
  const tag = block.tag || 'p';
  
  // If this Text is inside a Heading, just return the content without HTML tags
  if (parentType === 'Heading') {
    return content;
  }
  
  return `<${tag} class="${classes}">${content}</${tag}>`;
}

function renderCustomHTML(block) {
  const html = block.html || block.content || '';
  
  // Basic sanitization - in production you might want more robust sanitization
  return html;
}

function renderCard(block) {
  // Extract the original Card component properties
  const link = block.link || '#';
  const posterUrl = block.posterUrl || block.image || '';
  const m_title = block.m_title || block.title || '';
  const date = block.date || '';
  const place = block.place || '';
  const overlayed = block.overlayed || '';
  
  // Use original ChaiBuilder Card styling
  const boxClass = overlayed === "yes" 
    ? "w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800 opacity-50"
    : "w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800";
  
  let cardHTML = `<a href="${link}" target="_blank" class="">`;
  cardHTML += `<div class="${boxClass}">`;
  
  // Movie poster
  if (posterUrl) {
    cardHTML += `<img class="h-56 w-full object-cover xl:h-[400px]" src="${posterUrl}" alt="Card Image" loading="lazy">`;
  }
  
  // Content section with original styling
  cardHTML += '<div class="py-5 text-center xl:py-[30px]">';
  
  // Title
  if (m_title) {
    cardHTML += `<span class="block text-2xl font-bold text-gray-800 dark:text-white xl:text-[20px]" data-ai-key="content">${m_title}</span>`;
  }
  
  // Date
  if (date) {
    cardHTML += `<span class="block dark:text-white" data-ai-key="content">${date}</span>`;
  }
  
  // Place
  if (place) {
    cardHTML += `<span class="text-sm text-gray-700 dark:text-gray-200" data-ai-key="content">📍 ${place}</span>`;
  }
  
  cardHTML += '</div>'; // Close content div
  cardHTML += '</div>'; // Close card div  
  cardHTML += '</a>';   // Close link
  
  return cardHTML;
}

// Function to get all page routes
function getPageRoutes() {
  const chaiFiles = fs.readdirSync(CONFIG.chaiDir)
    .filter(file => file.endsWith('.chai') && !file.includes('.global.'))
    .map(file => file.replace('.chai', ''));
  
  console.log('Found pages:', chaiFiles);
  return chaiFiles;
}

// Function to ensure directory exists
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Main generation function
function generateStaticSite() {
  console.log('🚀 Starting static site generation...');
  
  // Clean output directory
  if (fs.existsSync(CONFIG.outputDir)) {
    fs.rmSync(CONFIG.outputDir, { recursive: true, force: true });
  }
  ensureDir(CONFIG.outputDir);
  
  // Copy public assets
  if (fs.existsSync(CONFIG.publicDir)) {
    console.log('📁 Copying public assets...');
    execSync(`cp -r "${CONFIG.publicDir}"/* "${CONFIG.outputDir}/"`);
  }
  
  // Generate pages
  const routes = getPageRoutes();
  
  routes.forEach(route => {
    console.log(`📄 Generating page: ${route}`);
    
    // Read page blocks
    let blocks = readChaiFile(`${route}.chai`);
    
    // Inject global blocks
    blocks = injectGlobalBlocks(blocks);
    
    // Generate HTML
    const html = renderChaiBlocksToHTML(blocks, route);
    
    // Determine output path
    let outputPath;
    if (route === 'home') {
      outputPath = path.join(CONFIG.outputDir, 'index.html');
    } else {
      const routeDir = path.join(CONFIG.outputDir, route);
      ensureDir(routeDir);
      outputPath = path.join(routeDir, 'index.html');
    }
    
    // Write HTML file
    fs.writeFileSync(outputPath, html);
    console.log(`✅ Generated: ${outputPath}`);
  });
  
  // Create .nojekyll file for GitHub Pages
  fs.writeFileSync(path.join(CONFIG.outputDir, '.nojekyll'), '');
  
  console.log('🎉 Static site generation complete!');
  console.log(`📦 Output directory: ${CONFIG.outputDir}`);
}

// Run if called directly
if (require.main === module) {
  generateStaticSite();
}

module.exports = { generateStaticSite, CONFIG };
