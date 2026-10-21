
import React, { useState } from "react";
import "./App.css";

const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");

function App() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleShorten(event) {
    event.preventDefault();

    setError("");
    setShortUrl("");
    setCopied(false);

    if (!API_URL) {
      setError("Backend URL is missing. Check frontend/.env.");
      return;
    }

    const trimmedUrl = originalUrl.trim();

    let parsedUrl;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setError("Enter a valid URL starting with https:// or http://.");
      return;
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setError("Only HTTP and HTTPS URLs are supported.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalUrl: parsedUrl.href,
        }),
      });

      const responseText = await response.text();

      let data;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Backend returned a non-JSON response (HTTP ${response.status}). Check your Render URL and backend logs.`
        );
      }

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            `Request failed with status ${response.status}.`
        );
      }

      const createdShortUrl = data.data?.shortUrl || data.shortUrl;

      if (!createdShortUrl) {
        throw new Error("The backend did not return a short URL.");
      }

      setShortUrl(createdShortUrl);
    } catch (err) {
      console.error("Short URL creation failed:", err);
      setError(
        err.message === "Failed to fetch"
          ? "Cannot reach the backend. Check the Render URL and CORS settings."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
    } catch {
      setError("Copy failed. Please select and copy the link manually.");
    }
  }

  return (
    <main className="page">
      <section className="shortener-card">
        <div className="brand-mark">↗</div>

        <p className="eyebrow">SMART LINK MANAGEMENT</p>
        <h1>Shorten your links.</h1>
        <p className="subtitle">
          Turn long URLs into short, shareable links.
        </p>

        <form onSubmit={handleShorten}>
          <label htmlFor="originalUrl">Your destination URL</label>

          <input
            id="originalUrl"
            type="url"
            placeholder="https://example.com/your-long-link"
            value={originalUrl}
            onChange={(event) => setOriginalUrl(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating your link..." : "Shorten URL"}
          </button>
        </form>

        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}

        {shortUrl && (
          <div className="result">
            <p className="result-label">Your shortened link</p>

            <div className="result-row">
              <a href={shortUrl} target="_blank" rel="noreferrer">
                {shortUrl}
              </a>

              <button
                type="button"
                className="copy-button"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            <p className="hint">
              Click your link to test the redirect.
            </p>
          </div>
        )}

        <p className="footer-note">
          Powered by your URL shortener backend
        </p>
      </section>
    </main>
  );
}

export default App;
