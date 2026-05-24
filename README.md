# Code Reviewer — AI PR Review Bot

บริการ NestJS ที่รีวิว GitHub Pull Request อัตโนมัติด้วย LLM: รับ GitHub Webhook → ส่งงานเข้า Queue (Bull/Redis) → ดึง diff ของ PR → สร้างรีวิว → โพสต์ summary และ inline comments กลับไปที่ Pull Request

## What it does
- Trigger เมื่อ PR `opened` หรือมีการอัปเดต (`synchronize`)
- สรุป PR + ประเมินความเสี่ยง (Risk) + คะแนนรวม (Score)
- แปะคำแนะนำแบบ inline comment บนไฟล์/บรรทัดที่เกี่ยวข้อง
- ทำงานแบบ async ผ่าน queue เพื่อไม่บล็อก webhook

## Tech Stack
- NestJS (TypeScript)
- Bull + Redis (job queue)
- GitHub App + Octokit (อ่าน PR files / โพสต์คอมเมนต์)
- OpenAI API (วิเคราะห์ diff)
- Docker / docker-compose (เดโม)

## Quick Start (Demo with Docker)
Prerequisites: Docker

1) สร้างไฟล์ `.env` ที่ root แล้วใส่ค่าต่อไปนี้:
- `OPENAI_API_KEY`
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- (optional) `OPENAI_MODEL=gpt-4o`
- (optional) `PORT=3000`
- (optional) `LOG_LEVEL=info`
- (dev optional) `SMEE_SOURCE=<your smee.io URL>`
- (prod optional) `GITHUB_WEBHOOK_SECRET=<webhook secret>`


2) รัน:
- `docker compose up --build`

3) Endpoint:
- API: `http://localhost:3000`
- Webhook: `POST http://localhost:3000/webhook`

## How reviews are triggered
- GitHub ส่ง webhook event `pull_request` มาที่ `/webhook`
- ระบบจะ enqueue งานเข้า queue ชื่อ `review` แล้ว worker จะประมวลผลและโพสต์ผลกลับไปที่ PR

### Local development (optional)
- `npm ci`
- เปิด Redis (เช่น `docker compose up redis`)
- `npm run start:dev`

## Notes
- การ verify webhook signature จะทำเฉพาะตอน `NODE_ENV=production` (ใช้ `GITHUB_WEBHOOK_SECRET`)
- โปรเจกต์นี้ออกแบบให้ “ตอบ webhook ทันที” แล้วค่อยทำงานรีวิวใน background ผ่าน queue