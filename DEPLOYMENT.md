# Deploy GridPulse to Vercel

The React app lives in `frontend/`. The repository root also contains an older
`index.html`; the Vercel configuration publishes only the built React app.

## Frontend

1. Push these changes to your Git repository and import it into Vercel.
2. Set **Root Directory** to `frontend`. The root `vercel.json` provides the
   install command, build command, and output directory for this frontend
   project.
3. Select **Node.js 24.x** in project settings (the version used to verify this
   project locally). Vite requires Node.js 20.19+ or 22.12+.
4. In Vercel's environment variables, set `VITE_API_URL` to your deployed backend
   URL **including `/api`**, such as `https://your-backend.example.com/api`.
   Set it for Production and for Preview if you use preview deployments.
5. Deploy. After changing `VITE_API_URL`, redeploy: Vite embeds the value at build
   time. Do not put secrets in `VITE_` variables.

The configuration runs:

```sh
npm ci
npm run build
```

The output directory is `dist` (relative to `frontend/`). It is generated during deployment and
should stay ignored by Git. The JavaScript chunk-size warning does not fail the
build.

## Backend

This frontend deployment does not deploy the FastAPI app in `backend/`.
Login, dashboard data, complaints, and other API features need a running public
backend. `localhost:8000` only works during local development.

Deploy `backend/` as a separate Python service. Install its dependencies with
`pip install -r requirements.txt` and start it from that directory with:

```sh
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Use the port supplied by your hosting provider. Configure `MONGODB_URL` and
`DATABASE_NAME` on that service for a persistent database. Without MongoDB, the
existing backend falls back to memory, so data is lost when the process restarts
and is not shared between instances.

Before connecting the frontend, check `https://your-backend.example.com/api/health`.
Use HTTPS for the backend URL when the frontend is served over HTTPS.

References: [Vercel project configuration](https://vercel.com/docs/project-configuration),
[Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).
