# Arbitrum Forum AI Counter

Small Python web app that scrapes an Arbitrum Foundation forum topic and shows an **AI counter** beside each post (main post + comments), plus an overall percentage.

## Features
- Paste any topic URL from `https://forum.arbitrum.foundation/`
- Scrape all posts in the topic via Discourse JSON endpoint
- Estimate AI-likelihood percentage per post
- Show weighted overall AI percentage for the full discussion
- Show recent topics for quick navigation
- Fallback mode: paste raw Discourse topic JSON when direct network scraping is blocked

## Run locally
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://localhost:5000`.

## If scraping fails with 403 tunnel/proxy errors
Some hosted preview environments block outbound requests.

Workaround:
1. Open your topic URL in a normal browser and append `.json`, e.g. `https://forum.arbitrum.foundation/t/.../.json`
2. Copy the JSON response
3. Paste it into the app's **topic JSON** box and click **Analyze Topic**

## Note on detection
The AI counter uses a heuristic text-based estimator and should be treated as directional, not definitive forensic detection.
