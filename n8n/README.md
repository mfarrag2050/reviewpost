# N8N Workflows — ReviewPost

5 automation workflows that connect the full ReviewPost pipeline.
N8N instance: `flow.primeflow.co`

## Required Environment Variables

Set these in N8N Settings → Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `REVIEWPOST_API_URL` | `http://localhost:3000` (dev) or `https://reviewpost.primeflow.co` (prod) | ReviewPost API base URL |
| `TELEGRAM_CHAT_ID` | Your Telegram chat ID | Where alerts are sent |
| `N8N_WEBHOOK_URL` | `https://flow.primeflow.co` | N8N base URL for inter-workflow triggers |

## Required Credentials

Create in N8N Settings → Credentials:

- **ReviewPost Telegram Bot** — Telegram Bot API with `TELEGRAM_BOT_TOKEN`

## Workflows

### 1. Review Pull (`review-pull.json`)
- **Trigger:** Cron every 6 hours
- **Flow:** Get active businesses → Pull Google Reviews for each → If new reviews found → Trigger content generation workflow
- **Error handling:** Telegram alert on failure

### 2. Content Generation (`content-generation.json`)
- **Trigger:** Webhook (called by Review Pull when new reviews found)
- **Flow:** Get new reviews → For each: Generate AI caption → Render Instagram template + Facebook template
- **Error handling:** Telegram alert on caption generation failure

### 3. Publishing Queue (`publishing.json`)
- **Trigger:** Cron every 15 minutes
- **Flow:** Call process-queue endpoint → Publishes all QUEUED posts where scheduled_at <= now
- **Notifications:** Telegram on successful publishes and on failures

### 4. Analytics Pull (`analytics.json`)
- **Trigger:** Cron every 6 hours
- **Flow:** Get posts published 24-72h ago without engagement data → Pull insights from IG/FB APIs → Update DB
- **Error handling:** Telegram alert on insight pull failure

### 5. Alerts & Meta-Automation (`alerts.json`)
Contains 3 independent sub-workflows:
- **Git Push Notification** — Webhook from GitHub, sends commit details to Telegram
- **Daily Summary** — Cron at 9 AM, sends daily stats to Telegram
- **Weekly Sprint Summary** — Cron Sunday 10 AM, sends weekly performance report

## How to Import

1. Open N8N at `flow.primeflow.co`
2. Go to **Workflows** → click **⋮** menu → **Import from File**
3. Select the `.json` file
4. Update credentials (Telegram Bot) in each workflow
5. **Activate** the workflow

Import order:
1. `alerts.json` (independent)
2. `content-generation.json` (has webhook trigger — note the webhook URL)
3. `review-pull.json` (triggers content-generation via webhook)
4. `publishing.json` (independent)
5. `analytics.json` (independent)

## GitHub Webhook Setup

For git push notifications:
1. Import `alerts.json` and activate it
2. Copy the webhook URL: `https://flow.primeflow.co/webhook/github-push`
3. In GitHub repo → Settings → Webhooks → Add webhook
4. Payload URL: the webhook URL above
5. Content type: `application/json`
6. Events: Just the `push` event

## Pipeline Flow

```
[Cron 6h] → Review Pull → [Webhook] → Content Generation
                                              ↓
                                    Posts created (QUEUED)
                                              ↓
[Cron 15m] → Publishing Queue → Publish to IG/FB
                                              ↓
[Cron 6h] → Analytics Pull → Update engagement data
                                              ↓
[Cron daily/weekly] → Alerts → Telegram summaries
```
