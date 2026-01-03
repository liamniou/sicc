# SICC - Stockholm International Cinema Collective

A static website for the Stockholm International Cinema Collective, a volunteer-run community that organises English-subtitled screenings of international films at independent cinemas around Stockholm.

🌐 **Live site:** [stockholminternationalcinema.com](https://stockholminternationalcinema.com)

## Project Structure

```
sicc/
├── build_site.py          # Python script to generate static HTML
├── events.yaml            # Event data (dates, movies, venues)
├── templates/             # HTML templates
│   ├── base.html          # Base template with header/footer
│   ├── home_content.html  # Home page content
│   ├── events_content.html # Events archive page
│   ├── about_content.html # About page
│   ├── contact_content.html # Contact page
│   └── work_content.html  # Work with SICC page
├── static-site/           # Generated output (git-ignored for local dev)
└── .github/workflows/     # GitHub Actions for deployment
```

## How It Works

1. **Event Data**: Events are stored in `events.yaml` with movie links, dates, and venues
2. **Movie Data**: The build script fetches poster images and titles from TheMovieDB API
3. **HTML Generation**: Python script combines templates with event data to create static HTML
4. **Deployment**: GitHub Actions automatically builds and deploys to GitHub Pages on push

## Adding a New Event

1. Edit `events.yaml` and add a new entry at the top:

```yaml
- date: Jan 15 2026
  moviedb: https://www.themoviedb.org/movie/12345
  link: https://tickets.example.com/event
  place: Bio Zita
```

2. Commit and push - the build will automatically:
   - Fetch the movie title and poster from TheMovieDB
   - Update `events.yaml` with the fetched data
   - Generate the static site
   - Deploy to GitHub Pages

![How to add a new event](how_to_add_new_event.gif)

## Local Development

### Prerequisites

- Python 3.9+
- TheMovieDB API key (optional, for fetching new movie data)

### Build Locally

```bash
# Install dependencies
pip install requests pyyaml

# Set API key (optional)
export MOVIEDB_API_KEY=your_api_key_here

# Build the site
python build_site.py

# View the site (open in browser)
open static-site/index.html
```

### Serve Locally

To test with a local web server:

```bash
cd static-site
python -m http.server 8000
# Open http://localhost:8000 in your browser
```

## Templates

Templates use simple `{{PLACEHOLDER}}` syntax for dynamic content:

- `{{CONTENT}}` - Main page content (in base.html)
- `{{MAIN_EVENTS}}` - Featured events on home page
- `{{ARCHIVE_EVENTS}}` - All past events

## Deployment

The site automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

### Manual Deployment

You can also trigger a deployment manually:

1. Go to the repository's "Actions" tab
2. Select "Deploy Static Site to GitHub Pages"
3. Click "Run workflow"

## Required Secrets

Configure these in your GitHub repository settings:

- `MOVIEDB_API_KEY` - API key from [TheMovieDB](https://www.themoviedb.org/settings/api)

## Tech Stack

- **HTML/CSS**: Tailwind CSS via CDN
- **Fonts**: Poppins from Google Fonts
- **Analytics**: Umami
- **Build**: Python 3
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## License

This project is for the Stockholm International Cinema Collective community.
