from __future__ import annotations

from html import escape
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs

from scraper import fetch_recent_topics, scrape_topic, scrape_topic_from_json_text
from scorer import estimate_ai_percentage


CSS = """
body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f6f7fb; color: #101828; }
.container { max-width: 1100px; margin: 0 auto; }
.card { background: white; border-radius: 10px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,.05); margin-bottom: 16px; }
form { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
input, textarea { width: 100%; padding: 10px; border: 1px solid #d0d5dd; border-radius: 6px; box-sizing: border-box; }
button { padding: 10px 14px; border: none; border-radius: 6px; background: #4f46e5; color: white; cursor: pointer; width: fit-content; }
.topic-list a { text-decoration: none; color: #1d4ed8; }
.post { display: flex; gap: 14px; align-items: flex-start; }
.post-main { flex: 1; }
.counter { min-width: 125px; text-align: center; background: #eef2ff; border-radius: 10px; padding: 10px; }
.counter .pct { font-size: 24px; font-weight: bold; color: #3730a3; }
.meta { font-size: 12px; color: #667085; margin-bottom: 8px; }
.error { color: #b42318; }
.muted { color: #667085; }
"""


def render_page(topic_url: str = "", topic_json_text: str = "", error: str = "") -> str:
    recent_html = ""
    try:
        recent_topics = fetch_recent_topics(limit=8)
        recent_html = "".join(
            f'<li><a href="{escape(t["url"])}" target="_blank">{escape(t["title"])}'
            f'</a> ({t["posts_count"]} posts)</li>'
            for t in recent_topics
        )
    except Exception:
        recent_html = "<li>Recent topics unavailable in this environment.</li>"

    details_html = ""
    if topic_url or topic_json_text:
        try:
            topic = scrape_topic_from_json_text(topic_json_text, topic_url=topic_url or "pasted://topic-json") if topic_json_text else scrape_topic(topic_url)
            post_items = []
            weighted_sum = 0.0
            total_words = 0
            for post in topic.posts:
                score = estimate_ai_percentage(post.text)
                wc = len(post.text.split())
                weighted_sum += score * wc
                total_words += wc
                post_items.append(
                    f'''<div class="card post">
<div class="post-main">
  <div class="meta">Post #{post.post_number} by @{escape(post.author)} · {escape(post.created_at)}</div>
  <div>{post.cooked_html}</div>
</div>
<div class="counter"><div>AI Counter</div><div class="pct">{score}%</div></div>
</div>'''
                )

            overall = round(weighted_sum / max(total_words, 1), 1)
            details_html = f'''
<div class="card">
  <h2>{escape(topic.title)}</h2>
  <p><a href="{escape(topic.url)}" target="_blank">Open original topic</a></p>
  <h3>Overall AI-likelihood (main post + comments): {overall}%</h3>
  <p class="muted">Heuristic estimate only, not definitive detection.</p>
</div>
{''.join(post_items)}
'''
        except Exception as exc:  # noqa: BLE001
            error = (
                f"Could not scrape topic: {exc}. "
                "If network is blocked, open the topic JSON in your browser (append .json to the topic URL) and paste it below."
            )

    error_html = f'<p class="error">{escape(error)}</p>' if error else ""

    return f'''<!doctype html>
<html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Arbitrum Forum AI Counter</title><style>{CSS}</style></head>
<body><div class="container">
<h1>Arbitrum Forum AI Counter</h1>
<p class="muted">Paste an Arbitrum forum topic URL and get an AI counter for the main post + comments.</p>
<div class="card">
<form method="post">
  <input name="topic_url" type="url" placeholder="https://forum.arbitrum.foundation/t/..." value="{escape(topic_url)}"/>
  <p class="muted">If direct scraping fails in this environment, paste topic JSON instead:</p>
  <textarea name="topic_json_text" rows="8" placeholder='{{"id":..., "title":"...", "post_stream":{{"posts":[...]}}}}'>{escape(topic_json_text)}</textarea>
  <button type="submit">Analyze Topic</button>
</form>{error_html}
</div>
<div class="card topic-list"><h3>Recent Topics</h3><ul>{recent_html}</ul></div>
{details_html}
</div></body></html>'''


class Handler(BaseHTTPRequestHandler):
    def _respond_html(self, html: str) -> None:
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        self._respond_html(render_page())

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(length).decode("utf-8")
        form = parse_qs(payload)
        topic_url = form.get("topic_url", [""])[0].strip()
        topic_json_text = form.get("topic_json_text", [""])[0].strip()
        self._respond_html(render_page(topic_url=topic_url, topic_json_text=topic_json_text))


def main() -> None:
    server = HTTPServer(("0.0.0.0", 5000), Handler)
    print("Serving on http://0.0.0.0:5000")
    server.serve_forever()


if __name__ == "__main__":
    main()
