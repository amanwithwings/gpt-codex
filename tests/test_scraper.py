from urllib.error import URLError

import scraper
from scraper import _topic_json_url


def test_topic_json_url_from_topic_path():
    assert _topic_json_url("https://forum.arbitrum.foundation/t/test-topic/123") == (
        "https://forum.arbitrum.foundation/t/test-topic/123.json"
    )


def test_topic_json_url_from_relative_path():
    assert _topic_json_url("/t/test-topic/123") == "https://forum.arbitrum.foundation/t/test-topic/123.json"


def test_read_json_retries_without_proxy(monkeypatch):
    class FakeResp:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def read(self):
            return b'{"ok": true}'

    calls = {"urlopen": 0, "opener": 0}

    def fake_urlopen(*args, **kwargs):
        calls["urlopen"] += 1
        raise URLError("Tunnel connection failed: 403 Forbidden")

    class FakeOpener:
        def open(self, *args, **kwargs):
            calls["opener"] += 1
            return FakeResp()

    monkeypatch.setattr(scraper, "urlopen", fake_urlopen)
    monkeypatch.setattr(scraper, "build_opener", lambda *args, **kwargs: FakeOpener())

    data = scraper._read_json("https://forum.arbitrum.foundation/latest.json")
    assert data == {"ok": True}
    assert calls == {"urlopen": 1, "opener": 1}


def test_scrape_topic_from_json_text():
    data = scraper.scrape_topic_from_json_text(
        '{"id":1,"title":"Hello","post_stream":{"posts":[{"post_number":1,"username":"alice","created_at":"2026-01-01","cooked":"<p>hi</p>"}]}}',
        topic_url="https://forum.arbitrum.foundation/t/hello/1",
    )
    assert data.title == "Hello"
    assert len(data.posts) == 1
    assert data.posts[0].text == "hi"
