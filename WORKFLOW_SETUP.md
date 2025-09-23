# GitHub Workflow Setup Guide

## Overview
This repository uses GitHub Actions to automatically test static site generation when changes are made to the ChaiBuilder files or event data.

## Workflow: Test Static Site Generation

### What it does:
1. **Event Data Processing**: Converts `events.yaml` to ChaiBuilder `.chai` files using TheMovieDB API
2. **Static Site Generation**: Generates static HTML from ChaiBuilder files
3. **Artifact Upload**: Creates downloadable build artifacts for review

### Triggers:
The workflow runs on pull requests that modify:
- `chaibuilder-nextjs/chai/**` - ChaiBuilder page files
- `chaibuilder-nextjs/blocks/**` - Custom components
- `chaibuilder-nextjs/app/**` - Next.js app files
- `events.yaml` - Event data file
- `convert_yaml_to_chai.py` - Conversion script
- Build scripts and configuration

### Required Secrets:

#### MOVIEDB_API_KEY
- **Purpose**: Fetches movie data (titles, poster URLs) from TheMovieDB API
- **Setup**: 
  1. Go to [TheMovieDB API Settings](https://www.themoviedb.org/settings/api)
  2. Create an account and request an API key
  3. In your GitHub repository, go to Settings → Secrets and variables → Actions
  4. Add a new secret named `MOVIEDB_API_KEY` with your API key as the value

### Process Flow:
```
events.yaml → [Python Script] → .chai files → [Node.js] → static HTML → [Upload] → Artifact
```

### Artifacts:
- **Name**: `static-site-build-{PR-number}`
- **Contents**: Complete static website ready for deployment
- **Retention**: 30 days

## Local Development

To run the conversion locally:
```bash
# Install Python dependencies
pip install requests pyyaml

# Set environment variable
export MOVIEDB_API_KEY=your_api_key_here

# Run conversion
python convert_yaml_to_chai.py

# Generate static site
cd chaibuilder-nextjs
npm run build:static
```

## Troubleshooting

### Common Issues:
1. **Missing MOVIEDB_API_KEY**: Ensure the secret is properly configured in GitHub repository settings
2. **Invalid events.yaml**: Check YAML syntax and required fields (date, moviedb, link, place)
3. **API Rate Limits**: TheMovieDB API has rate limits; large event updates may need to be batched

### Event Data Format:
```yaml
- date: "Sep 30 2025"
  link: "https://example.com/event"
  moviedb: "https://www.themoviedb.org/movie/123456-movie-title"
  place: "Cinema Name"
  # title and poster_url are auto-generated from moviedb if missing
```
