from __future__ import annotations

import json
from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
from urllib.request import ProxyHandler, Request, build_opener, urlopen

BASE_FORUM_URL = "https://forum.arbitrum.foundation"


class _HTMLTextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.chunks: list[str] = []

    def handle_data(self, data: str) -> None:
        if data.strip():
            self.chunks.append(data.strip())

    def get_text(self) -> str:
        return " ".join(self.chunks)


@dataclass
class TopicPost:
    post_number: int
    author: str
    created_at: str
    cooked_html: str
    text: str


@dataclass
class TopicData:
    topic_id: int
    title: str
    url: str
    posts: list[TopicPost]


def _clean_html(html: str) -> str:
    parser = _HTMLTextExtractor()
    parser.feed(html)
    return " ".join(parser.get_text().split())


def _topic_json_url(topic_url: str) -> str:
    parsed = urlparse(topic_url)
    if not parsed.scheme:
        topic_url = urljoin(BASE_FORUM_URL, topic_url)
        parsed = urlparse(topic_url)

    clean_path = parsed.path.rstrip("/")
    json_path = clean_path if clean_path.endswith(".json") else f"{clean_path}.json"
    return f"{parsed.scheme}://{parsed.netloc}{json_path}"


def _read_json(url: str, timeout: int = 20) -> dict:
    req = Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})

    try:
        with urlopen(req, timeout=timeout) as resp:  # noqa: S310
            payload = resp.read().decode("utf-8")
    except Exception:
        opener = build_opener(ProxyHandler({}))
        with opener.open(req, timeout=timeout) as resp:  # noqa: S310
            payload = resp.read().decode("utf-8")

    return json.loads(payload)


def _topic_data_from_payload(payload: dict, topic_url: str) -> TopicData:
    posts: list[TopicPost] = []
    for post in payload.get("post_stream", {}).get("posts", []):
        cooked_html = post.get("cooked", "")
        posts.append(
            TopicPost(
                post_number=post.get("post_number", 0),
                author=post.get("username", "unknown"),
                created_at=post.get("created_at", ""),
                cooked_html=cooked_html,
                text=_clean_html(cooked_html),
            )
        )

    return TopicData(
        topic_id=payload.get("id", 0),
        title=payload.get("title", "Untitled Topic"),
        url=topic_url,
        posts=posts,
    )


def scrape_topic(topic_url: str, timeout: int = 20) -> TopicData:
    payload = _read_json(_topic_json_url(topic_url), timeout=timeout)
    return _topic_data_from_payload(payload, topic_url=topic_url)


def scrape_topic_from_json_text(topic_json_text: str, topic_url: str = "pasted://topic-json") -> TopicData:
    payload = json.loads(topic_json_text)
    return _topic_data_from_payload(payload, topic_url=topic_url)


def fetch_recent_topics(limit: int = 8, timeout: int = 20) -> list[dict]:
    payload = _read_json(urljoin(BASE_FORUM_URL, "/latest.json"), timeout=timeout)
    topics = payload.get("topic_list", {}).get("topics", [])[:limit]

    result = []
    for topic in topics:
        slug = topic.get("slug", "")
        topic_id = topic.get("id")
        topic_url = urljoin(BASE_FORUM_URL, f"/t/{slug}/{topic_id}")
        result.append(
            {
                "id": topic_id,
                "title": topic.get("title", "Untitled Topic"),
                "posts_count": topic.get("posts_count", 0),
                "url": topic_url,
            }
        )
    return result
