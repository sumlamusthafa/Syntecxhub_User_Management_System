# Roster: student portal (frontend)

React + Vite frontend for the User Management API, presented as a college student portal.

- **Students** register, sign in, and keep their own details up to date.
- **Staff** (admin role) see every student record: search, page through the list, give or remove staff access, and delete records.

The API stores roles as `user` and `admin`. The interface shows them as `student` and `staff`.

## Run locally

```bash
npm install
npm run dev
```

The app talks to `http://localhost:5000` by default. To use another API, copy `.env.example` to `.env` and set `VITE_API_URL`.

## Build

```bash
npm run build
```

## Stack

React, React Router, Vite. Plain CSS, no UI library.
