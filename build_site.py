#!/usr/bin/env python3
"""
SICC Static Site Generator

Converts events.yaml to static HTML pages using templates.
No Node.js or external build tools required.

Usage:
    python build_site.py

Environment variables:
    MOVIEDB_API_KEY - TheMovieDB API key for fetching movie data
"""

import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

import requests
import yaml


# Configuration
ROOT_DIR = Path(__file__).parent
TEMPLATES_DIR = ROOT_DIR / "templates"
OUTPUT_DIR = ROOT_DIR / "static-site"
EVENTS_FILE = ROOT_DIR / "events.yaml"

# TheMovieDB API
API_KEY = os.getenv("MOVIEDB_API_KEY")
DEFAULT_TICKET_LINK = "https://linktr.ee/stockholminternationalcinema"


def get_movie_data(moviedb_url: str) -> dict | None:
    """Fetch movie data from TheMovieDB API."""
    if not API_KEY:
        print("Warning: MOVIEDB_API_KEY not set, skipping movie data fetch")
        return None
    
    try:
        movie_id = moviedb_url.rstrip("/").split("/")[-1]
        # Handle cases where the URL has additional path segments like movie name
        if "-" in movie_id:
            movie_id = movie_id.split("-")[0]
    except (IndexError, AttributeError):
        print(f"Error parsing movie ID from URL: {moviedb_url}")
        return None

    api_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={API_KEY}"
    
    try:
        response = requests.get(api_url, timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error fetching data for {moviedb_url}: {response.status_code}")
            return None
    except requests.RequestException as e:
        print(f"Network error fetching {moviedb_url}: {e}")
        return None


def load_events() -> list[dict]:
    """Load and enrich events from YAML file."""
    if not EVENTS_FILE.exists():
        print(f"Error: {EVENTS_FILE} not found")
        sys.exit(1)
    
    with open(EVENTS_FILE, "r", encoding="utf-8") as f:
        events = yaml.safe_load(f) or []
    
    # Enrich events with movie data if missing
    updated = False
    for event in events:
        if not event.get("moviedb"):
            print(f"Warning: Event missing moviedb URL: {event}")
            continue
        
        if not event.get("title") or not event.get("poster_url"):
            movie_data = get_movie_data(event["moviedb"])
            if movie_data:
                if not event.get("title"):
                    event["title"] = movie_data.get("title", "Unknown")
                if not event.get("poster_url"):
                    poster_path = movie_data.get("poster_path", "")
                    if poster_path:
                        event["poster_url"] = f"https://image.tmdb.org/t/p/w600_and_h900_bestv2{poster_path}"
                updated = True
            elif API_KEY:
                # Only fail if API key was provided but fetch failed
                print(f"Error: Could not fetch movie data for {event.get('moviedb')}")
                sys.exit(1)
            else:
                # No API key - use placeholder values
                if not event.get("title"):
                    event["title"] = "Coming Soon"
                if not event.get("poster_url"):
                    event["poster_url"] = "https://via.placeholder.com/600x900?text=Coming+Soon"
                print(f"Warning: Using placeholder for {event.get('moviedb')} (no API key)")
    
    # Save updated events back to file
    if updated:
        with open(EVENTS_FILE, "w", encoding="utf-8") as f:
            yaml.safe_dump(events, f, allow_unicode=True)
        print("Updated events.yaml with movie data")
    
    return events


def parse_date(date_str: str) -> datetime:
    """Parse date string like 'Dec 10 2025' to datetime."""
    return datetime.strptime(date_str, "%b %d %Y")


def render_event_card(event: dict, is_past: bool = False) -> str:
    """Render a single event card HTML."""
    link = event.get("link", DEFAULT_TICKET_LINK)
    poster_url = event.get("poster_url", "")
    title = event.get("title", "Unknown")
    date = event.get("date", "")
    place = event.get("place", "")
    
    opacity_class = "opacity-50" if is_past else ""
    
    return f'''<a href="{link}" target="_blank">
  <div class="w-full max-w-xs overflow-hidden rounded-lg bg-white shadow-lg {opacity_class}">
    <img class="h-56 w-full object-cover xl:h-[400px]" src="{poster_url}" alt="{title}" loading="lazy">
    <div class="py-5 text-center xl:py-[30px]">
      <span class="block text-2xl font-bold text-gray-800 xl:text-[20px]">{title}</span>
      <span class="block text-black">{date}</span>
      <span class="text-sm text-gray-700">📍 {place}</span>
    </div>
  </div>
</a>'''


def load_template(name: str) -> str:
    """Load an HTML template file."""
    template_path = TEMPLATES_DIR / name
    if not template_path.exists():
        print(f"Error: Template {name} not found at {template_path}")
        sys.exit(1)
    
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


def render_page(content: str) -> str:
    """Render content into the base template."""
    base = load_template("base.html")
    return base.replace("{{CONTENT}}", content)


def ensure_dir(path: Path) -> None:
    """Ensure a directory exists."""
    path.mkdir(parents=True, exist_ok=True)


def build_site() -> None:
    """Build the complete static site."""
    print("🚀 Building SICC static site...")
    
    # Load events
    events = load_events()
    now = datetime.now()
    
    # Separate upcoming and past events
    upcoming = []
    past = []
    for event in events:
        try:
            event_date = parse_date(event.get("date", ""))
            if event_date >= now:
                upcoming.append(event)
            else:
                past.append(event)
        except ValueError as e:
            print(f"Warning: Could not parse date for event: {event.get('title', 'Unknown')} - {e}")
            past.append(event)
    
    # Sort: upcoming by date ascending, past by date descending
    upcoming.sort(key=lambda x: parse_date(x.get("date", "Jan 1 2000")))
    past.sort(key=lambda x: parse_date(x.get("date", "Jan 1 2000")), reverse=True)
    
    # Select events for main page (up to 4, prioritizing upcoming)
    if len(upcoming) >= 3:
        main_events = upcoming[:3] + past[:1]
    elif len(upcoming) == 2:
        main_events = upcoming[:2] + past[:2]
    elif len(upcoming) == 1:
        main_events = upcoming[:1] + past[:3]
    else:
        main_events = past[:4]
    
    # Clean output directory
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    ensure_dir(OUTPUT_DIR)
    
    # Build home page
    print("📄 Building home page...")
    main_events_html = "\n".join(
        render_event_card(e, is_past=(parse_date(e["date"]) < now))
        for e in main_events
    )
    home_content = load_template("home_content.html").replace("{{MAIN_EVENTS}}", main_events_html)
    home_html = render_page(home_content)
    with open(OUTPUT_DIR / "index.html", "w", encoding="utf-8") as f:
        f.write(home_html)
    
    # Build events archive page
    print("📄 Building events page...")
    ensure_dir(OUTPUT_DIR / "events")
    archive_events_html = "\n".join(render_event_card(e, is_past=True) for e in past)
    events_content = load_template("events_content.html").replace("{{ARCHIVE_EVENTS}}", archive_events_html)
    events_html = render_page(events_content)
    with open(OUTPUT_DIR / "events" / "index.html", "w", encoding="utf-8") as f:
        f.write(events_html)
    
    # Build about page
    print("📄 Building about page...")
    ensure_dir(OUTPUT_DIR / "about")
    about_content = load_template("about_content.html")
    about_html = render_page(about_content)
    with open(OUTPUT_DIR / "about" / "index.html", "w", encoding="utf-8") as f:
        f.write(about_html)
    
    # Build contact page
    print("📄 Building contact page...")
    ensure_dir(OUTPUT_DIR / "contact")
    contact_content = load_template("contact_content.html")
    contact_html = render_page(contact_content)
    with open(OUTPUT_DIR / "contact" / "index.html", "w", encoding="utf-8") as f:
        f.write(contact_html)
    
    # Build work page
    print("📄 Building work page...")
    ensure_dir(OUTPUT_DIR / "work")
    work_content = load_template("work_content.html")
    work_html = render_page(work_content)
    with open(OUTPUT_DIR / "work" / "index.html", "w", encoding="utf-8") as f:
        f.write(work_html)
    
    # Create .nojekyll file for GitHub Pages
    (OUTPUT_DIR / ".nojekyll").touch()
    
    print(f"✅ Site built successfully!")
    print(f"📦 Output: {OUTPUT_DIR}")
    print(f"   - index.html (home)")
    print(f"   - events/index.html ({len(past)} past events)")
    print(f"   - about/index.html")
    print(f"   - contact/index.html")
    print(f"   - work/index.html")


if __name__ == "__main__":
    build_site()
