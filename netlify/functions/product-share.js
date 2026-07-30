const SUPABASE_URL = "https://xdrtjcrrzhkwohnxeqkz.supabase.co";
const SUPABASE_KEY = "sb_publishable_MDr5H_bMdj9H5w5gLLbheg_u5MhjDm9";
const SITE_URL = "https://velmora-shop.netlify.app";
const DEFAULT_IMAGE = SITE_URL + "/og-image.png";

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPage({ title, description, image, redirectUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(redirectUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<meta http-equiv="refresh" content="0; url=${escapeHtml(redirectUrl)}">
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body>
<p>Redirecting to <a href="${escapeHtml(redirectUrl)}">Velmora Shop</a>...</p>
</body>
</html>`;
}

exports.handler = async function (event) {
  const productId = event.queryStringParameters && event.queryStringParameters.id;
  const redirectUrl = productId
    ? `${SITE_URL}/?product=${encodeURIComponent(productId)}`
    : SITE_URL + "/";

  if (!productId) {
    return {
      statusCode: 302,
      headers: { Location: redirectUrl },
      body: "",
    };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!res.ok) throw new Error("Supabase fetch failed: " + res.status);
    const rows = await res.json();
    const p = rows && rows[0];

    if (!p) {
      const html = renderPage({
        title: "Velmora Shop — Curated Everyday Luxury",
        description:
          "A small edit of things worth owning — chosen, not just sold. Shop with Cash on Delivery across Saudi Arabia.",
        image: DEFAULT_IMAGE,
        redirectUrl: SITE_URL + "/",
      });
      return {
        statusCode: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
        body: html,
      };
    }

    let images = [];
    try {
      images = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    } catch (e) {
      images = p.image ? [p.image] : [];
    }
    const image = images[0] || DEFAULT_IMAGE;
    const title = `${p.name} — ${p.price} SAR | Velmora Shop`;
    const description = p.description || "A small edit of things worth owning — chosen, not just sold.";

    const html = renderPage({ title, description, image, redirectUrl });

    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: html,
    };
  } catch (err) {
    const html = renderPage({
      title: "Velmora Shop — Curated Everyday Luxury",
      description:
        "A small edit of things worth owning — chosen, not just sold. Shop with Cash on Delivery across Saudi Arabia.",
      image: DEFAULT_IMAGE,
      redirectUrl,
    });
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
      body: html,
    };
  }
};
