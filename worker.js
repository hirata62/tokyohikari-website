// 旧・日本語URL（検索エンジンに残った旧インデックス）を現行の英語パスへ恒久リダイレクト。
// 例: /会社概要 (/%E4%BC%9A%E7%A4%BE%E6%A6%82%E8%A6%81) → /company
const LEGACY_PATH_MAP = {
  "/会社概要": "/company",
  "/業務内容": "/services",
  "/アクセス": "/access",
  "/お問い合わせ": "/contact",
  "/3つの強み": "/strengths",
  "/プライバシーポリシー": "/privacy",
};

// サイトの正規オリジン。www無し・httpでも同じ内容が見えると重複扱いになるため、
// ここへ301で集約する。ローカル開発やworkers.devは対象外にしたいので
// 本番の2ホストだけを判定対象にする。
const CANONICAL_HOST = "www.tokyohikari.jp";
const PRODUCTION_HOSTS = ["tokyohikari.jp", "www.tokyohikari.jp"];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // %エンコードされた旧URLをデコードして判定（末尾スラッシュは無視）
    let decodedPath = url.pathname;
    try { decodedPath = decodeURIComponent(url.pathname); } catch (e) {}
    decodedPath = decodedPath.replace(/\/+$/, "");

    // 正規化（ホスト・プロトコル・旧日本語URL）はまとめて1回の301で返す。
    // 個別に返すと「www無しの旧URL」で転送が2回連鎖してしまうため。
    const needsHostFix =
      PRODUCTION_HOSTS.includes(url.hostname) &&
      (url.hostname !== CANONICAL_HOST || url.protocol !== "https:");
    const legacyTarget = LEGACY_PATH_MAP[decodedPath];

    if (needsHostFix || legacyTarget) {
      const target = new URL(url);
      if (needsHostFix) {
        target.protocol = "https:";
        target.hostname = CANONICAL_HOST;
      }
      if (legacyTarget) {
        target.pathname = legacyTarget;
      }
      // GET/HEAD は301。それ以外（お問い合わせフォームのPOST等）は
      // 301だとメソッドとBodyが失われるため、それらを保持する308を使う。
      const isSafeMethod = request.method === "GET" || request.method === "HEAD";
      return Response.redirect(target.toString(), isSafeMethod ? 301 : 308);
    }

    if (url.pathname === "/api/contact") {
      if (request.method !== "POST") {
        return json({ ok: false, error: "method_not_allowed" }, 405);
      }
      return handleContact(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function handleContact(request, env) {
  let data;
  try {
    data = await request.formData();
  } catch (e) {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // ハニーポット（人間には見えない欄。埋まっていたらbotとみなし、成功を装って捨てる）
  if ((data.get("company") || "").trim() !== "") {
    return json({ ok: true });
  }

  const name = (data.get("name") || "").trim();
  const email = (data.get("email") || "").trim();
  const phone = (data.get("phone") || "").trim();
  const message = (data.get("message") || "").trim();
  const token = data.get("cf-turnstile-response") || "";

  if (!name || name.length > 100) return json({ ok: false, error: "invalid_name" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
    return json({ ok: false, error: "invalid_email" }, 400);
  if (phone.length > 40) return json({ ok: false, error: "invalid_phone" }, 400);
  if (!message || message.length > 5000) return json({ ok: false, error: "invalid_message" }, 400);

  console.log("diag: secrets present", {
    hasTurnstileSecret: !!env.TURNSTILE_SECRET_KEY,
    hasResendKey: !!env.RESEND_API_KEY,
  });

  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: request.headers.get("CF-Connecting-IP"),
    }),
  });
  const outcome = await verify.json();
  if (!outcome.success) {
    console.log("diag: turnstile failed", outcome["error-codes"]);
    return json({ ok: false, error: "turnstile_failed" }, 403);
  }

  const body = [
    "ホームページのお問い合わせフォームから送信がありました。",
    "",
    "■お名前: " + name,
    "■メールアドレス: " + email,
    "■お電話番号: " + (phone || "（未記入）"),
    "",
    "■お問い合わせ内容:",
    message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "東京ひかり不動産HP <form@tokyohikari.jp>",
      to: ["info@tokyohikari.jp"],
      reply_to: email,
      subject: "【HPお問い合わせ】" + name + " 様より",
      text: body,
    }),
  });

  if (!res.ok) {
    console.log("diag: resend failed", res.status, await res.text());
    return json({ ok: false, error: "mail_failed" }, 502);
  }
  return json({ ok: true });
}
