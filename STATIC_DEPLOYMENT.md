# Static Site Generation & GitHub Pages Deployment

This document explains how to use the new static site generation system for your ChaiBuilder-based website.

## Overview

The system converts your ChaiBuilder `.chai` files into static HTML pages that can be deployed to GitHub Pages. This provides:
- ⚡ Fast loading static pages
- 🚀 Free hosting on GitHub Pages  
- 🔄 Automatic deployment via GitHub Actions
- 📱 Mobile-friendly responsive design

## How it Works

1. **Static Generation**: The `generate-static.js` script reads your `.chai` files from the `chaibuilder-nextjs/chai/` directory
2. **Global Block Injection**: Automatically injects global blocks (header, footer, etc.) into pages
3. **HTML Rendering**: Converts ChaiBuilder JSON blocks to HTML with Tailwind CSS classes
4. **GitHub Pages Structure**: Creates proper file structure (`/about/index.html`) for GitHub Pages routing

## Available Scripts

All scripts should be run from the `chaibuilder-nextjs/` directory:

### Local Development
```bash
# Generate static site locally
npm run build:static

# The output will be in ../static-site/
```

### Manual Deployment
```bash
# Deploy to GitHub Pages (checks git status first)
npm run deploy

# Force deploy (skip git status check)
npm run deploy:force
```

### Environment Variables
You can customize the deployment with these environment variables:

```bash
# Set base URL for GitHub Pages (if repo is not at root)
GITHUB_PAGES_BASE_URL=/your-repo-name npm run deploy

# Force deployment without checking git status
FORCE_DEPLOY=yes npm run deploy

# Skip all git checks
SKIP_GIT_CHECK=true npm run deploy
```

## Automatic Deployment (Recommended)

The system includes a GitHub Actions workflow that automatically deploys your site when you push to the `main` branch.

### Setup Instructions

1. **Enable GitHub Pages**:
   - Go to your repository settings
   - Navigate to "Pages" section
   - Set source to "GitHub Actions"

2. **Push Changes**:
   ```bash
   git add .
   git commit -m "Add static site generation"
   git push origin main
   ```

3. **Monitor Deployment**:
   - Check the "Actions" tab in your GitHub repository
   - Your site will be available at `https://yourusername.github.io/your-repo-name/`

## File Structure

After generation, your static site will have this structure:

```
static-site/
├── index.html              # Home page (from home.chai)
├── about/
│   └── index.html          # About page (from about.chai)
├── events/
│   └── index.html          # Events page (from events.chai)
├── work/
│   └── index.html          # Work page (from work.chai)
├── contact/
│   └── index.html          # Contact page (from contact.chai)
├── .nojekyll              # Tells GitHub Pages to serve files as-is
└── [other assets]         # Copied from public/ directory
```

## Supported ChaiBuilder Blocks

The static generator supports these ChaiBuilder block types:
- ✅ **Box** - Converts to HTML elements (div, section, header, etc.)
- ✅ **Heading** - Converts to h1, h2, h3, etc.
- ✅ **Paragraph** - Converts to `<p>` tags
- ✅ **Link** - Converts to `<a>` tags with proper routing
- ✅ **Image** - Converts to `<img>` tags with lazy loading
- ✅ **Button** - Converts to `<button>` tags with icons
- ✅ **Span** - Converts to `<span>` tags
- ✅ **Divider** - Converts to `<hr>` tags
- ✅ **Global Blocks** - Automatically injects header, footer, etc.

## Styling

The generated HTML includes:
- 🎨 **Tailwind CSS** via CDN for styling
- 🔤 **Google Fonts (Poppins)** for typography
- 📱 **Responsive design** with mobile-first approach
- 🌙 **Dark mode support** (light mode by default)

## Troubleshooting

### Common Issues

1. **"Working directory is not clean"**
   ```bash
   # Commit your changes first
   git add .
   git commit -m "Your changes"
   
   # Or force deploy
   npm run deploy:force
   ```

2. **Missing global blocks**
   - Ensure `.global.chai` files exist in the `chai/` directory
   - Check that global block names match the filenames

3. **Broken links on GitHub Pages**
   - Links are automatically converted to work with GitHub Pages
   - Internal links like `/about` become `/about/index.html`

4. **GitHub Actions failing**
   - Check that GitHub Pages is enabled in repository settings
   - Verify the workflow has proper permissions

### Debug Mode

To see detailed output during generation:
```bash
# Run the generator directly
node ../scripts/generate-static.js
```

## Customization

### Adding New Pages

1. Create a new `.chai` file in `chaibuilder-nextjs/chai/`
2. The filename becomes the URL (e.g., `services.chai` → `/services/`)
3. Run the deployment script

### Modifying Global Blocks

1. Edit the `.global.chai` files (header.global.chai, footer.global.chai, etc.)
2. Changes will be applied to all pages that use those global blocks

### Custom Styling

The generator includes Tailwind CSS via CDN. To add custom styles:
1. Modify the CSS in the `renderChaiBlocksToHTML` function
2. Or add custom stylesheets to the HTML template

## Next Steps

- 🔧 Consider setting up a custom domain for your GitHub Pages site
- 📊 Monitor your site with the included Umami analytics
- 🚀 Explore adding more interactive features with Alpine.js
- 📝 Keep your `.chai` files organized and well-structured

## Support

If you encounter issues:
1. Check the GitHub Actions logs for detailed error messages
2. Verify your `.chai` files are valid JSON
3. Test locally with `npm run build:static` before deploying
