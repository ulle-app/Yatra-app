import os
import requests
import wikipediaapi
from bs4 import BeautifulSoup
from urllib.parse import urljoin

# ================= CONFIG =================
BASE_DIR = "temples_images"
IMAGES_PER_PLACE = 2
USER_AGENT = "TempleImageDownloader/1.1 (website use)"
HEADERS = {"User-Agent": USER_AGENT}

# Temple name → Wikipedia article title
TEMPLES = {
    "Kashi_Vishwanath": "Kashi Vishwanath Temple",
    "Tirumala_Tirupati": "Venkateswara Temple, Tirumala",
    "Vaishno_Devi": "Vaishno Devi",
    "Somnath": "Somnath temple",
    "Kedarnath": "Kedarnath Temple",
    "Badrinath": "Badrinath Temple",
    "Ramanathaswamy": "Ramanathaswamy Temple",
    "Akshardham_Delhi": "Swaminarayan Akshardham (Delhi)",
    "Brihadeeswarar": "Brihadeeswarar Temple",
    "Dwarkadhish": "Dwarkadhish Temple",
    "Shirdi_Sai_Baba": "Shirdi Sai Baba Temple",
    "Lingaraj": "Lingaraja Temple",
    "Mahabodhi": "Mahabodhi Temple",
    "Kamakhya": "Kamakhya Temple",
    "Padmanabhaswamy": "Padmanabhaswamy Temple",
    "Konark_Sun_Temple": "Konark Sun Temple",
    "Mahakaleshwar": "Mahakaleshwar Jyotirlinga",
    "Kailasa_Ellora": "Kailasa temple, Ellora",
    "Veerabhadra_Lepakshi": "Veerabhadra Temple, Lepakshi",
    "Vittala_Hampi": "Vittala Temple",
    "Jagannath_Puri": "Jagannath Temple, Puri",
    "Meenakshi_Amman": "Meenakshi Temple",
    "Siddhivinayak_Mumbai": "Siddhivinayak Temple",
    "Golden_Temple": "Golden Temple"
}

# Wikipedia API
wiki = wikipediaapi.Wikipedia(
    language="en",
    user_agent=USER_AGENT
)

os.makedirs(BASE_DIR, exist_ok=True)

# ================= HELPERS =================

def is_valid_photo(url: str) -> bool:
    """Filter out SVGs, maps, icons"""
    bad_ext = (".svg", ".svg.png", ".png")
    return (
        "upload.wikimedia.org" in url
        and not any(ext in url.lower() for ext in bad_ext)
    )

def extract_images_from_html(html):
    soup = BeautifulSoup(html, "html.parser")
    images = []

    for img in soup.find_all("img"):
        src = img.get("src")
        if not src:
            continue
        if src.startswith("//"):
            src = "https:" + src
        if is_valid_photo(src):
            images.append(src)

    return list(dict.fromkeys(images))

def download_images(image_urls, folder):
    os.makedirs(folder, exist_ok=True)
    for i, url in enumerate(image_urls[:IMAGES_PER_PLACE], start=1):
        data = requests.get(url, headers=HEADERS, timeout=20).content
        with open(os.path.join(folder, f"{i}.jpg"), "wb") as f:
            f.write(data)

# ================= CORE LOGIC =================

def download_temple_images(folder_name, wiki_title):
    folder = os.path.join(BASE_DIR, folder_name)

    print(f"\n🔹 Processing: {wiki_title}")

    page = wiki.page(wiki_title)
    images = []

    # ---- 1️⃣ Wikipedia article page ----
    if page.exists():
        try:
            html = requests.get(page.fullurl, headers=HEADERS, timeout=20).text
            images = extract_images_from_html(html)
        except Exception:
            pass

    # ---- 2️⃣ Fallback: Wikimedia Commons category ----
    if len(images) < IMAGES_PER_PLACE:
        commons_url = f"https://commons.wikimedia.org/wiki/Category:{wiki_title.replace(' ', '_')}"
        try:
            html = requests.get(commons_url, headers=HEADERS, timeout=20).text
            commons_images = extract_images_from_html(html)
            images.extend(commons_images)
            images = list(dict.fromkeys(images))
        except Exception:
            pass

    if not images:
        print(f"❌ No usable images found for {wiki_title}")
        return

    download_images(images, folder)
    print(f"✅ Downloaded {min(len(images), IMAGES_PER_PLACE)} images")

# ================= RUN =================

for folder, title in TEMPLES.items():
    download_temple_images(folder, title)

print("\n🎉 All temples processed successfully!")