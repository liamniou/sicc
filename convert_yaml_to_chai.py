import json
import os
import random
import requests
import string
import yaml
from datetime import datetime


api_key = os.getenv("MOVIEDB_API_KEY")


def get_movie_data(moviedb_url, api_key):
    try:
        movie_id = moviedb_url.split("/")[-1]
    except IndexError:
        print("Error parsing movie ID from URL:", moviedb_url)
        return None

    api_url = f"https://api.themoviedb.org/3/movie/{movie_id}?api_key={api_key}"
    response = requests.get(api_url)

    if response.status_code == 200:
        movie_data = response.json()
        return movie_data
    else:
        print(f"Error fetching data for {moviedb_url}: {response.status_code}")
        return None


def generate_random_id(length=6):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=length))


def transform_yaml_data_for_archive(input_data):
    transformed_data = []

    for entry in input_data:
        new_entry = {
            "_type": "Card",
            "_id": generate_random_id(),
            "link": entry.get("link", ""),
            "posterUrl": entry.get("poster_url", ""),
            "date": entry.get("date", ""),
            "place": entry.get("place", ""),
            "_parent": "agxwtp",
            "m_title": entry.get("title", ""),
            "overlayed": "no"
        }
        transformed_data.append(new_entry)

    return transformed_data


def transform_yaml_data_for_main(input_data):
    transformed_data = []

    for entry in input_data:
        date = datetime.strptime(entry.get("date"), "%b %d %Y")
        if date >= datetime.now():
            overlayed = "no"
            link = "https://linktr.ee/stockholminternationalcinema?fbclid=PAZXh0bgNhZW0CMTEAAaYqvNB_0VmVLUNqMeQY8TeCXsE7TjVUyT7386TAtVZC-zJMFv-IojXxmqc_aem_cAkyAH35ta87jcGScWn_fw"
        else:
            overlayed = "yes"
            link = entry.get("link", "")
        new_entry = {
            "_type": "Card",
            "_id": generate_random_id(),
            "link": link,
            "posterUrl": entry.get("poster_url", ""),
            "date": entry.get("date", ""),
            "place": entry.get("place", ""),
            "_parent": "Cyxtbm",
            "m_title": entry.get("title", ""),
            "overlayed": overlayed
        }
        transformed_data.append(new_entry)

    return transformed_data


def main():
    with open('events.yaml', 'r', encoding='utf-8') as file:
        data = yaml.safe_load(file)

    re_read_yaml = False

    for entry in data:
        if not entry.get("moviedb", None):
            print("Error: moviedb URL not found in entry:", entry)
            exit(1)
        if entry.get("title", None) is None or entry.get("poster_url", None) is None:
            movie_data = get_movie_data(entry.get("moviedb", ""), api_key)
            if movie_data:
                entry["title"] = movie_data.get("title")
                entry["poster_url"] = f"https://image.tmdb.org/t/p/w600_and_h900_bestv2{movie_data.get('poster_path')}"
                with open('events.yaml', 'w', encoding='utf-8') as file:
                    yaml.safe_dump(data, file)
                re_read_yaml = True

    if re_read_yaml:
        with open('events.yaml', 'r', encoding='utf-8') as file:
            data = yaml.safe_load(file)

    main_page_events = []
    upcoming_events = []
    past_events = []
    for entry in data:
        date = datetime.strptime(entry.get("date"), "%b %d %Y")
        if date >= datetime.now():
            upcoming_events.append(entry)
        else:
            past_events.append(entry)
    if len(upcoming_events) >= 2:
        main_page_events = upcoming_events[:2] + past_events[:2]
    elif len(upcoming_events) == 1:
        main_page_events = upcoming_events + past_events[:3]
    else:
        main_page_events = past_events[:4]

    transformed_data = transform_yaml_data_for_main(main_page_events)
    with open('chaibuilder-nextjs/chai/main_events.global.chai', 'w', encoding='utf-8') as file:
        json.dump(transformed_data, file, ensure_ascii=False, indent=2)

    transformed_data = transform_yaml_data_for_archive(past_events)
    with open('chaibuilder-nextjs/chai/events.global.chai', 'w', encoding='utf-8') as file:
        json.dump(transformed_data, file, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
