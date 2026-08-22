# GlobeTrotter

Travel planning app. Frontend is React + Vite. Backend is Express + TypeScript.

## What we commit vs what we do not

This is the Node equivalent of Python `requirements.txt`.

| Commit these | Do not commit these |
|---|---|
| `package.json` (library list) | `node_modules/` |
| `package-lock.json` (exact versions) | `.env` |
| `.env.example` | `dist/` |

Teammates install libraries themselves with `npm install`. Never push `node_modules`.

## Prerequisites

- Node.js 20 or newer (22 recommended; see `.nvmrc`)
- npm 10 or newer

Check with:

```bash
node -v
npm -v
```

## First-time setup

Clone the repo, then install in each app folder.

### Frontend

```bash
cd Frontend
cp .env.example .env
npm install
npm run dev
```

On Windows PowerShell, use `copy .env.example .env` instead of `cp`.

Frontend runs at http://localhost:5173

### Backend

```bash
cd Backend
cp .env.example .env
```

Fill in `DATABASE_URL` and `JWT_SECRET` in `Backend/.env`, then:

```bash
npm install
npm run dev
```

Backend runs at http://localhost:5000

## Daily workflow

```bash
git checkout -b feature/your-name
cd Frontend   # or Backend
npm install   # only needed after package.json changes
npm run dev
```

If `package.json` or `package-lock.json` changed on a pull, run `npm install` again in that folder.

## Adding a library

Use npm so the lockfile stays in sync:

```bash
cd Frontend   # or Backend
npm install package-name
```

Then commit `package.json` **and** `package-lock.json`. Do not edit the lockfile by hand.
