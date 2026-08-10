// Netlify Function: emails everyone on a product's waiting list once it's
// back in stock, via Resend. Matches the same setup as send-order-email.js.
// Requires environment variable RESEND_API_KEY to be set in Netlify site
// settings (Site configuration → Environment variables) — already set.

const SITE_URL = "https://velmora-shop.netlify.app";
const FROM_EMAIL = "Velmora Shop <onboarding@resend.dev>"; // update once a custom domain is verified in Resend — keep in sync with send-order-email.js

const LABELS = {
  en: {
    subject: (name) => `${name} is back in stock! — Velmora Shop`,
    heading: "Good news!",
    body: (name) => `<strong>${name}</strong> is back in stock at Velmora Shop.`,
    cta: "Shop Now",
    footer: "You received this because you asked to be notified when this product was back in stock.",
  },
  ar: {
    subject: (name) => `${name} متوفر الآن من جديد! — Velmora Shop`,
    heading: "خبر سار!",
    body: (name) => `<strong>${name}</strong> أصبح متوفرًا الآن في Velmora Shop.`,
    cta: "تسوق الآن",
    footer: "تلقيت هذه الرسالة لأنك طلبت إعلامك عند توفر هذا المنتج.",
  },
  ur: {
    subject: (name) => `${name} دوبارہ دستیاب ہے! — Velmora Shop`,
    heading: "خوشخبری!",
    body: (name) => `<strong>${name}</strong> اب Velmora Shop پر دستیاب ہے۔`,
    cta: "ابھی خریدیں",
    footer: "یہ ای میل آپ کو اس لیے موصول ہوئی کیونکہ آپ نے اس پروڈکٹ کی دستیابی پر مطلع کرنے کی درخواست دی تھی۔",
  },
  hi: {
    subject: (name) => `${name} फिर से स्टॉक में है! — Velmora Shop`,
    heading: "अच्छी खबर!",
    body: (name) => `<strong>${name}</strong> अब Velmora Shop पर उपलब्ध है।`,
    cta: "अभी खरीदें",
    footer: "आपको यह ईमेल इसलिए मिला क्योंकि आपने इस उत्पाद के उपलब्ध होने पर सूचित करने का अनुरोध किया था।",
  },
};

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(L, productName, productLink) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f7f4ef; font-family:Arial, sans-serif; color:#1b1b1b;">
  <div style="max-width:560px; margin:0 auto; padding:32px 20px;">
    <div style="text-align:center; margin-bottom:24px;">
      <h1 style="color:#5a4a30; font-size:22px; margin:0;">Velmora Shop</h1>
    </div>
    <div style="background:#fff; border-radius:14px; padding:28px; border:1px solid #eee; text-align:center;">
      <h2 style="font-size:19px; margin:0 0 12px;">${L.heading}</h2>
      <p style="margin:0 0 20px; font-size:14px; color:#444;">${L.body(escapeHtml(productName))}</p>
      <a href="${productLink}" style="display:inline-block; background:#1b1b1b; color:#fff; padding:12px 26px; border-radius:10px; text-decoration:none; font-weight:bold; font-size:14px;">${L.cta}</a>
      <p style="font-size:12px; color:#999; margin:24px 0 0;">${L.footer}</p>
    </div>
  </div>
</body>
</html>`;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return { statusCode: 500, body: JSON.stringify({ error: "Email service not configured" }) };
  }

  try {
    const data = JSON.parse(event.body);
    const { emails, productName, productId } = data;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "No emails provided" }) };
    }

    const lang = LABELS[data.lang] ? data.lang : "en";
    const L = LABELS[lang];
    const productLink = `${SITE_URL}/?product=${encodeURIComponent(productId)}`;
    const html = buildEmailHtml(L, productName, productLink);

    // Send one email per recipient so each customer's address stays private from the others
    const results = await Promise.all(
      emails.map((toEmail) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [toEmail],
            subject: L.subject(productName),
            html: html,
          }),
        })
      )
    );

    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) {
      console.error(`${failed} of ${emails.length} back-in-stock emails failed to send`);
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, sent: emails.length - failed, failed }) };
  } catch (err) {
    console.error("send-back-in-stock-email error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
