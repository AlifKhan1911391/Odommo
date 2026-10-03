// POST { name, images: [dataURL, ...] } -> pushes each image to GitHub
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const send = (code, obj) => ({
  statusCode: code,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return send(405, { error: "POST only" });

  const {
    GITHUB_TOKEN,
    GITHUB_OWNER = "AlifKhan1911391",
    GITHUB_REPO = "Odommo",
    GITHUB_BRANCH = "main",
  } = process.env;
  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO)
    return send(500, { error: "Server is missing GitHub settings." });

  let body;
  try { body = JSON.parse(event.body || "{}"); } catch { return send(400, { error: "Bad request." }); }
  const { name, images } = body;

  // Only allow names that exist in toxic.json
  const names = await (await fetch(new URL("/toxic.json", event.rawUrl).href)).json();
  if (!names.includes(name)) return send(400, { error: "Unknown name." });

  if (!Array.isArray(images) || images.length < 1 || images.length > 5)
    return send(400, { error: "Upload 1 to 5 screenshots." });
  const re = /^data:image\/jpeg;base64,/;
  if (!images.every((i) => typeof i === "string" && re.test(i)))
    return send(400, { error: "Only JPEG images are accepted." });

  const slug = slugify(name);
  const urls = [];
  for (const img of images) {
    const file = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
    const path = `screenshots/${slug}/${file}`;
    const r = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "odommo-batch",
        },
        body: JSON.stringify({
          message: `Add screenshot for ${name}`,
          content: img.replace(re, ""),
          branch: GITHUB_BRANCH,
        }),
      }
    );
    if (!r.ok) return send(502, { error: "GitHub rejected the upload.", status: r.status });
    urls.push(`https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}`);
  }
  return send(200, { ok: true, urls });
};
