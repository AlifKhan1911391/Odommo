// GET -> { "pk": [url, ...], "modina-modina-md": [url, ...] }
exports.handler = async () => {
  const {
    GITHUB_TOKEN,
    GITHUB_OWNER = "AlifKhan1911391",
    GITHUB_REPO = "Odommo",
    GITHUB_BRANCH = "main",
  } = process.env;
  const headers = { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" };
  try {
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/${GITHUB_BRANCH}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "odommo-batch",
        },
      }
    );
    if (!r.ok) return { statusCode: 200, headers, body: "{}" };
    const { tree = [] } = await r.json();
    const out = {};
    for (const t of tree) {
      const m = t.path.match(/^screenshots\/([^/]+)\/[^/]+\.jpg$/);
      if (!m) continue;
      (out[m[1]] ||= []).push(
        `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${t.path}`
      );
    }
    for (const k in out) out[k].sort().reverse(); // newest first
    return { statusCode: 200, headers, body: JSON.stringify(out) };
  } catch {
    return { statusCode: 200, headers, body: "{}" };
  }
};
