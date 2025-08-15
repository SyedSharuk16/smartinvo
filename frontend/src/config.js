// Central location for the backend base URL.
// Remove any trailing slashes so API calls don't contain double slashes.
const defaultUrl =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:8000";
const rawUrl = process.env.REACT_APP_API_URL || defaultUrl;
export const API_URL = rawUrl.replace(/\/+$/, "");
