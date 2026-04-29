export default {

  // ===== TELEGRAM WEBHOOK =====
  async fetch(req, env) {
    if (req.method !== "POST") return new Response("Bot Running");

    const data = await req.json();
    if (!data.message) return new Response("ok");

    const chat_id = data.message.chat.id;
    const text = data.message.text || "";

    if (text === "/start") {

      // 1. Register subscriber so cron can alert them
      let subs = await env.DATA.get("subscribers");
      subs = subs ? JSON.parse(subs) : [];
      if (!subs.includes(chat_id)) {
        subs.push(chat_id);
        await env.DATA.put("subscribers", JSON.stringify(subs));
      }

      // 2. Load notices (stored as [{title, link}] objects)
      let all = await env.DATA.get("notices");
      all = all ? JSON.parse(all) : [];

      // 3. Load which links this user has already seen
      let seen = await env.DATA.get("seen_" + chat_id);
      seen = seen ? JSON.parse(seen) : [];

      const newNotices = all.filter(n => !seen.includes(n.link));

      // 4. Build message
      let msg = "";
      if (newNotices.length > 0) {
        msg += `🆕 *New Updates* (${newNotices.length})\n\n`;
        for (const n of newNotices.slice(0, 5)) {
          msg += `• [${n.title}](${n.link})\n\n`;
        }
      } else {
        msg += "✅ No new updates\n\n";
      }

      msg += "📜 *Last 5 Notices*\n\n";
      for (const n of all.slice(0, 5)) {
        msg += `• [${n.title}](${n.link})\n\n`;
      }

      // 5. Mark everything as seen
      await env.DATA.put("seen_" + chat_id, JSON.stringify(all.map(n => n.link)));

      // 6. Send message
      await sendTelegramMessage(env.BOT_TOKEN, chat_id, msg);
    }

    return new Response("ok");
  },

  // ===== CRON (every 5 min) =====
  async scheduled(event, env, ctx) {
    try {
      const res = await fetch(
        "https://nests.tribal.gov.in/show_content.php?lang=1&level=1&ls_id=949&lid=550"
      );
      const html = await res.text();

      const notices = [];
      const seenLinks = new Set();

      // Match each <tr>...</tr> block
      const rows = [...html.matchAll(/<tr[\s>][\s\S]*?<\/tr>/gi)];

      for (const rowMatch of rows) {
        const row = rowMatch[0];

        // Skip rows with no PDF link
        const pdfMatch = row.match(/href="([^"]*\.pdf[^"]*)"/i);
        if (!pdfMatch) continue;

        // Build absolute URL
        let link = pdfMatch[1].trim();
        if (!link.startsWith("http")) {
          link = "https://nests.tribal.gov.in/" + link.replace(/^\//, "");
        }
        if (seenLinks.has(link)) continue;
        seenLinks.add(link);

        // Extract all <td> cells in this row
        const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
        if (cells.length < 2) continue;

        // Title is always the 2nd <td> — strip inner tags, collapse whitespace
        const title = cells[1][1]
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        if (!title) continue;
        notices.push({ title, link });
      }

      // Load previously stored notices
      let old = await env.DATA.get("notices");
      old = old ? JSON.parse(old) : [];
      const oldLinks = new Set(old.map(n => n.link));

      // Find genuinely new notices
      const newNotices = notices.filter(n => !oldLinks.has(n.link));

      if (newNotices.length > 0) {
        // Save updated list
        await env.DATA.put("notices", JSON.stringify(notices));

        // Alert all registered subscribers
        let subs = await env.DATA.get("subscribers");
        subs = subs ? JSON.parse(subs) : [];

        let alert = `🔔 *New Notice${newNotices.length > 1 ? "s" : ""} on NESTS!*\n\n`;
        for (const n of newNotices) {
          alert += `📄 [${n.title}](${n.link})\n\n`;
        }

        for (const chat_id of subs) {
          await sendTelegramMessage(env.BOT_TOKEN, chat_id, alert);
        }

      } else if (JSON.stringify(notices.map(n => n.link)) !== JSON.stringify(old.map(n => n.link))) {
        // Order changed or something removed — resave silently
        await env.DATA.put("notices", JSON.stringify(notices));
      }

    } catch (e) {
      console.error("Cron error:", e);
    }
  }
};

// ===== HELPER =====
async function sendTelegramMessage(token, chat_id, text) {
  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    })
  });
}
