# SmartInvo

SmartInvo consists of a FastAPI backend and a React frontend.

## Local development

### Backend
1. Create a virtual environment and install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
2. Start the API:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend
1. Install dependencies (requires internet access):
   ```bash
   cd frontend
   npm install
   ```
2. Create a `.env` file with the API URL:
   ```
   REACT_APP_API_URL=http://localhost:8000
   ```
3. Run the development server:
   ```bash
   npm start
   ```

## Deployment

### Backend on Render
1. Push the project to GitHub.
2. In [Render](https://render.com), create a *Web Service* linked to the repo.
3. Build command: `pip install -r backend/requirements.txt`
4. Start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

### Frontend on GitHub Pages
1. Ensure `REACT_APP_API_URL` points to the deployed backend.
2. Build and deploy:
   ```bash
   npm run deploy
   ```
   This runs `npm run build` and publishes the `build/` folder to the `gh-pages` branch.

### Alternative static hosts
You can also deploy the `frontend` on [Netlify](https://netlify.com) or [Vercel](https://vercel.com). Use build command `npm run build` and publish directory `build`.

