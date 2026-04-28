export default {

  // ===== TELEGRAM WEBHOOK =====
  async fetch(req, env) {
    if (req.method === "POST") {
      const data = await req.json();

      if (data.message) {
        const chat_id = data.message.chat.id;
        const text = data.message.text || "";

        if (text === "/start") {
          let all = await env.DATA.get("links");
          all = all ? JSON.parse(all) : [];

          let seen = await env.DATA.get("seen_" + chat_id);
          seen = seen ? JSON.parse(seen) : [];

          const newLinks = all.filter(l => !seen.includes(l));

          let msg = "";

          // NEW
          if (newLinks.length > 0) {
            msg += "🆕 New Updates:\n\n";
            for (let l of newLinks.slice(0, 5)) {
              msg += "• " + l + "\n\n";
            }
          } else {
            msg += "✅ No new updates\n\n";
          }

          // LAST 5
          msg += "📜 Last 5 Notices:\n\n";
          for (let l of all.slice(0, 5)) {
            msg += "• " + l + "\n\n";
          }

          // save seen
          await env.DATA.put("seen_" + chat_id, JSON.stringify(all));

          // send message
          await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
              chat_id,
              text: msg
            })
          });
        }
      }

      return new Response("ok");
    }

    return new Response("Bot Running");
  },

  // ===== CRON (every 5 min) =====
  async scheduled(event, env, ctx) {
    try {
      const res = await fetch("https://nests.tribal.gov.in/show_content.php?lang=1&level=1&ls_id=949&lid=550");
      const html = await res.text();

      const links = [...html.matchAll(/href="(.*?\.pdf)"/g)].map(m => {
        let l = m[1];
        if (!l.startsWith("http")) {
          l = "https://nests.tribal.gov.in/" + l;
        }
        return l;
      });

      let old = await env.DATA.get("links");
      old = old ? JSON.parse(old) : [];

      if (JSON.stringify(links) !== JSON.stringify(old)) {
        await env.DATA.put("links", JSON.stringify(links));
      }

    } catch (e) {
      console.log(e);
    }
  }
}
