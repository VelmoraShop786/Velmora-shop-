// Netlify Function: sends an order confirmation email to the customer via Resend.
// Requires environment variable RESEND_API_KEY to be set in Netlify site settings
// (Site configuration → Environment variables). Never commit the API key to code.

const SITE_URL = "https://velmora-shop.netlify.app";
const FROM_EMAIL = "Velmora Shop <onboarding@resend.dev>"; // update once a custom domain is verified in Resend

const LABELS = {
  en: {
    subject: (orderId) => `Order Confirmed — ${orderId} | Velmora Shop`,
    heading: "Thank you for your order!",
    greeting: (name) => `Hi ${name},`,
    intro: "We've received your order and it's being processed. Here are your order details:",
    orderId: "Order ID",
    items: "Items",
    qty: "Qty",
    subtotal: "Subtotal",
    discount: "Discount",
    delivery: "Delivery",
    free: "FREE",
    total: "Total",
    address: "Delivery Address",
    phone: "Phone",
    payment: "Payment Method",
    cod: "Cash on Delivery (COD)",
    footer: "We'll contact you shortly to confirm delivery. Thank you for shopping with Velmora Shop!",
  },
  ar: {
    subject: (orderId) => `تم تأكيد طلبك — ${orderId} | Velmora Shop`,
    heading: "شكرًا لطلبك!",
    greeting: (name) => `مرحبًا ${name}،`,
    intro: "لقد استلمنا طلبك وجارٍ تجهيزه. إليك تفاصيل طلبك:",
    orderId: "رقم الطلب",
    items: "المنتجات",
    qty: "الكمية",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    delivery: "التوصيل",
    free: "مجاني",
    total: "الإجمالي",
    address: "عنوان التوصيل",
    phone: "الهاتف",
    payment: "طريقة الدفع",
    cod: "الدفع عند الاستلام",
    footer: "سنتواصل معك قريبًا لتأكيد التوصيل. شكرًا لتسوقك مع Velmora Shop!",
  },
  ur: {
    subject: (orderId) => `آرڈر کنفرم ہو گیا — ${orderId} | Velmora Shop`,
    heading: "آپ کے آرڈر کا شکریہ!",
    greeting: (name) => `ہیلو ${name}،`,
    intro: "ہمیں آپ کا آرڈر مل گیا ہے اور اسے تیار کیا جا رہا ہے۔ آرڈر کی تفصیلات یہ ہیں:",
    orderId: "آرڈر آئی ڈی",
    items: "اشیاء",
    qty: "تعداد",
    subtotal: "ذیلی کل",
    discount: "ڈسکاؤنٹ",
    delivery: "ڈیلیوری",
    free: "مفت",
    total: "کل رقم",
    address: "ڈیلیوری ایڈریس",
    phone: "فون",
    payment: "ادائیگی کا طریقہ",
    cod: "ادائیگی آن ڈیلیوری (COD)",
    footer: "ہم آپ سے جلد ڈیلیوری کی تصدیق کے لیے رابطہ کریں گے۔ Velmora Shop سے خریداری کا شکریہ!",
  },
  hi: {
    subject: (orderId) => `ऑर्डर कन्फर्म हो गया — ${orderId} | Velmora Shop`,
    heading: "आपके ऑर्डर के लिए धन्यवाद!",
    greeting: (name) => `नमस्ते ${name},`,
    intro: "हमें आपका ऑर्डर मिल गया है और उसे तैयार किया जा रहा है। ऑर्डर विवरण यह है:",
    orderId: "ऑर्डर आईडी",
    items: "आइटम",
    qty: "मात्रा",
    subtotal: "सब-टोटल",
    discount: "छूट",
    delivery: "डिलीवरी",
    free: "मुफ़्त",
    total: "कुल",
    address: "डिलीवरी पता",
    phone: "फ़ोन",
    payment: "भुगतान का तरीका",
    cod: "कैश ऑन डिलीवरी (COD)",
    footer: "हम जल्द ही डिलीवरी की पुष्टि के लिए आपसे संपर्क करेंगे। Velmora Shop से खरीदारी के लिए धन्यवाद!",
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

function buildEmailHtml(L, data) {
  const itemRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0; border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0; border-bottom:1px solid #eee; text-align:right;">${item.price * item.quantity} SAR</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f7f4ef; font-family:Arial, sans-serif; color:#1b1b1b;">
  <div style="max-width:560px; margin:0 auto; padding:32px 20px;">
    <div style="text-align:center; margin-bottom:24px;">
      <h1 style="color:#5a4a30; font-size:22px; margin:0;">Velmora Shop</h1>
    </div>
    <div style="background:#fff; border-radius:14px; padding:28px; border:1px solid #eee;">
      <h2 style="font-size:19px; margin:0 0 6px;">${L.heading}</h2>
      <p style="margin:0 0 4px; font-size:14px; color:#444;">${L.greeting(escapeHtml(data.customerName))}</p>
      <p style="margin:0 0 20px; font-size:14px; color:#444;">${L.intro}</p>

      <p style="font-size:13px; color:#777; margin:0 0 16px;">${L.orderId}: <strong style="color:#1b1b1b;">${escapeHtml(data.orderId)}</strong></p>

      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left; padding-bottom:8px; border-bottom:2px solid #1b1b1b;">${L.items}</th>
            <th style="text-align:center; padding-bottom:8px; border-bottom:2px solid #1b1b1b;">${L.qty}</th>
            <th style="text-align:right; padding-bottom:8px; border-bottom:2px solid #1b1b1b;"></th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <table style="width:100%; font-size:13px; margin-bottom:20px;">
        <tr><td style="padding:3px 0; color:#666;">${L.subtotal}</td><td style="text-align:right;">${data.subtotal} SAR</td></tr>
        ${data.discount > 0 ? `<tr><td style="padding:3px 0; color:#666;">${L.discount}</td><td style="text-align:right;">-${data.discount} SAR</td></tr>` : ""}
        <tr><td style="padding:3px 0; color:#666;">${L.delivery}</td><td style="text-align:right;">${data.deliveryFee > 0 ? data.deliveryFee + " SAR" : L.free}</td></tr>
        <tr><td style="padding:8px 0 0; font-weight:700; font-size:15px;">${L.total}</td><td style="text-align:right; padding:8px 0 0; font-weight:700; font-size:15px;">${data.total} SAR</td></tr>
      </table>

      <div style="background:#f7f4ef; border-radius:10px; padding:14px 16px; font-size:13px; color:#444; margin-bottom:16px;">
        <p style="margin:0 0 4px;"><strong>${L.address}:</strong> ${escapeHtml(data.address)}</p>
        <p style="margin:0 0 4px;"><strong>${L.phone}:</strong> ${escapeHtml(data.phone)}</p>
        <p style="margin:0;"><strong>${L.payment}:</strong> ${L.cod}</p>
      </div>

      <p style="font-size:13px; color:#777; margin:0;">${L.footer}</p>
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
    if (!data.toEmail) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing recipient email" }) };
    }

    const lang = LABELS[data.lang] ? data.lang : "en";
    const L = LABELS[lang];

    const html = buildEmailHtml(L, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [data.toEmail],
        subject: L.subject(data.orderId),
        html: html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend API error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "Failed to send email" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("send-order-email error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Internal error" }) };
  }
};
