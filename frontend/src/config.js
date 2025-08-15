// Central location for the backend base URL.
// Remove any trailing slashes so API calls don't contain double slashes.
const rawUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";
export const API_URL = rawUrl.replace(/\/+$/, "");

