/* 表示の仕組み（ふだんは触らなくてOK。内容の更新は js/data.js で） */
(() => {
  const D = window.FUSP;
  const $ = (s, el = document) => el.querySelector(s);
  const slot = (name) => $(`[data-render="${name}"]`);
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const br = (s) => esc(s).replace(/\n/g, "<br>");
  const genre = (id) => D.genres.find((g) => g.id === id);
  const colorOf = (c) => (c && c.startsWith("#") ? c : (genre(c) || {}).color || "#1d64a7");
  const set = (name, html) => { const el = slot(name); if (el) el.innerHTML = html; return el; };

  /* ---- ヘッダー ---- */
  const menu = $(".hd-menu");
  if (menu) {
    menu.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      menu.setAttribute("aria-expanded", open);
    });
    document.querySelectorAll(".hd-nav a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  }

  /* ---- お知らせ ---- */
  if (slot("news") && D.news.length) {
    slot("news").closest("section").hidden = false;
    set("news", D.news.map((n) => `
      <li><details class="news-item${n.important ? " is-important" : ""}"${n.open ? " open" : ""}>
        <summary>
          ${n.important ? '<span class="tag">重要</span>' : '<span class="tag tag-info">お知らせ</span>'}
          <span class="news-title">${esc(n.title)}</span>
          ${n.date ? `<time>${esc(n.date)}</time>` : ""}
        </summary>
        <div class="news-body">${br(n.body)}</div>
      </details></li>`).join(""));
  }

  /* ---- ABOUT ---- */
  set("about", br(D.about));
  set("dates", `<span class="m">${D.dates[0].month}<small>月</small></span>` + D.dates.map((d) =>
    `<span class="d">${d.day}<small>(${d.week})</small></span>`).join('<span class="dot">・</span>'));
  const v = set("venue", `<small>会場</small>${esc(D.venue.name)}<span class="arrow sm"></span>`);
  if (v) v.href = D.venue.url;
  set("venue-address", `${esc(D.venue.nameJa)}<br>${esc(D.venue.address)}`);
  if (slot("recap")) {
    const id = D.recapYoutubeId;
    const el = set("recap", `<button class="yt-btn" style="background-image:url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)" aria-label="動画を再生"><span></span></button>`);
    el.querySelector("button").addEventListener("click", () => {
      el.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" title="FUSP Recap" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    });
  }

  /* ---- ジャンル ---- */
  const modal = $("#genreModal");
  if (slot("genres")) {
    set("genres", D.genres.map((g, i) => `
      <button class="genre-btn" style="--c:${g.color}" data-i="${i}">
        <span class="g-ill"><img src="img/genre/${g.illust}" alt="" loading="lazy"></span>
        <span class="g-txt"><span class="g-en">${esc(g.en)}</span><span class="g-ja">${esc(g.ja)}</span></span>
        <span class="arrow" aria-hidden="true"></span>
      </button>`).join(""));
    slot("genres").addEventListener("click", (e) => {
      const b = e.target.closest(".genre-btn"); if (!b) return;
      const g = D.genres[b.dataset.i];
      modal.style.setProperty("--c", g.color);
      $(".modal-body", modal).innerHTML = `
        <div class="m-ill${g.photo ? " is-photo" : ""}"><img src="${g.photo ? esc(g.photo) : `img/genre/${g.illust}`}" alt="${esc(g.ja)}"></div>
        <h3 class="m-en">${esc(g.en)}</h3><p class="m-ja">${esc(g.ja)}</p>
        <h4>どんな種目？</h4><p class="m-text">${esc(g.text)}</p>
        <a class="btn" href="trial.html">体験してみる！<span class="arrow sm"></span></a>`;
      modal.showModal();
    });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  }

  /* ---- イベント ---- */
  set("events", D.events.map((e) => `
    <a class="ev${e.notice ? " is-off" : ""}" href="${esc(e.url)}" target="_blank" rel="noopener" style="--c:${e.color}">
      <div class="ev-logo"><img src="${esc(e.logo)}" alt="${esc(e.name)}" loading="lazy"></div>
      <div class="ev-meta"><span class="ev-date">${esc(e.date)}</span><span class="ev-place">${esc(e.place)}</span></div>
      <p class="ev-catch">${br(e.catch)}</p>
      <p class="ev-name">${esc(e.name)}</p>
      <span class="ev-more">About<span class="arrow sm"></span></span>
      ${e.notice ? `<p class="ev-notice">${esc(e.notice)}</p>` : ""}
    </a>`).join(""));

  /* ---- タイムテーブル ---- */
  if (slot("tt")) {
    const T = D.timetable;
    const min = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const t0 = min(T.from), t1 = min(T.to);
    const PX = 1.3; // 1分あたりの高さ(px)
    const draw = (di) => {
      const day = T.days[di];
      let hours = "";
      for (let t = Math.ceil(t0 / 60) * 60; t <= t1; t += 30) {
        const full = t % 60 === 0;
        hours += `<div class="tt-line${full ? "" : " half"}" style="top:${(t - t0) * PX}px">${full ? `<span>${t / 60}:00</span>` : ""}</div>`;
      }
      const cols = T.floors.map((f, fi) => `
        <div class="tt-col">
          ${day.items.filter((it) => it.floor === fi).map((it) => {
            const top = (min(it.start) - t0) * PX, h = (min(it.end) - min(it.start)) * PX;
            return `<div class="tt-item${it.canceled ? " is-off" : ""}${h < 50 ? " is-short" : ""}" style="top:${top}px;height:${h}px;--c:${colorOf(it.color)}">
              <span class="tt-time">${it.start} - ${it.end}</span>
              <b>${esc(it.title)}</b>${it.sub ? `<span class="tt-sub">${esc(it.sub)}</span>` : ""}
              ${it.canceled ? '<span class="tt-off">中止</span>' : ""}</div>`;
          }).join("")}
        </div>`).join("");
      set("tt", `
        <div class="tt-head"><div></div>${T.floors.map((f) => `<div><b>${esc(f.name)}</b><small>${esc(f.sub)}</small></div>`).join("")}</div>
        <div class="tt-body" style="height:${(t1 - t0) * PX + 10}px">${hours}<div class="tt-cols">${cols}</div></div>`);
      slot("tt-tabs").querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", i === di));
    };
    set("tt-tabs", T.days.map((d, i) => `<button role="tab" data-i="${i}"><b>${esc(d.label)}</b> ${esc(d.date)}</button>`).join(""));
    slot("tt-tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) draw(+b.dataset.i); });
    draw(0);
  }

  /* ---- 開催概要・地図 ---- */
  set("overview", D.overview.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${br(v)}</dd></div>`).join(""));
  set("map", `<iframe src="${esc(D.mapEmbed)}" loading="lazy" title="会場地図" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <p>${esc(D.venue.nameJa)}<br><small>${esc(D.venue.address)}</small></p>`);

  /* ---- お問い合わせ ---- */
  if (slot("contact")) {
    if (!D.contactEndpoint) {
      set("contact", `<p class="center">お問い合わせは、下記メールアドレスまでお送りください。</p>
        <p class="center"><a class="btn" href="mailto:${esc(D.contactEmail)}">${esc(D.contactEmail)}<span class="arrow sm"></span></a></p>`);
    } else {
      const el = set("contact", `
        <form class="cf">
          <label>お名前<em>*</em><input name="name" required autocomplete="name"></label>
          <label>お名前（カタカナ）<em>*</em><input name="kana" required></label>
          <label>メールアドレス<em>*</em><input name="email" type="email" required autocomplete="email">
            <small>「${esc(D.contactEmail)}」からのメールを受信できるアドレスをご入力ください。迷惑メールフィルタなどで届かない場合があります。</small></label>
          <label>お問い合わせ内容<em>*</em><select name="type" required><option value="">お選びください</option>
            ${D.contactTypes.map((t) => `<option>${esc(t)}</option>`).join("")}</select></label>
          <label>内容<em>*</em><textarea name="message" rows="6" required></textarea></label>
          <input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          <p class="center small">上記の内容に誤りがないことを確認し、フォームを送信します。</p>
          <p class="center"><button class="btn" type="submit">フォーム送信<span class="arrow sm"></span></button></p>
          <p class="cf-msg" role="status"></p>
        </form>`);
      const form = el.querySelector("form"), msg = el.querySelector(".cf-msg");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const btn = form.querySelector("button"); btn.disabled = true; msg.textContent = "送信中…";
        try {
          await fetch(D.contactEndpoint, { method: "POST", body: new URLSearchParams(new FormData(form)) , mode: "no-cors" });
          form.reset(); msg.textContent = "送信しました。お問い合わせありがとうございます。";
        } catch (err) {
          msg.textContent = `送信できませんでした。お手数ですが ${D.contactEmail} までメールでお送りください。`;
        }
        btn.disabled = false;
      });
    }
  }

  /* ---- 協賛 ---- */
  set("sponsors", D.sponsors.map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener"><img src="${esc(s.logo)}" alt="${esc(s.name)}" loading="lazy"></a>`).join(""));
  const ig = slot("instagram"); if (ig) ig.href = D.instagram;

  /* ---- 体験会ページ ---- */
  const TR = D.trial;
  set("trial-lead", br(TR.lead));
  set("trial-info", TR.info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${br(v)}</dd></div>`).join(""));
  const forms = TR.forms.map((f) => `<a class="btn btn-big" href="${esc(f.url)}" target="_blank" rel="noopener">${esc(f.text)}<span class="arrow sm"></span></a>`).join("");
  set("trial-forms", forms); set("trial-forms-2", forms);
  set("trial-schedule", TR.schedule.map((d) => `
    <div class="ts-day"><h3>${esc(d.day)}</h3><ul>
      ${d.items.map((it) => { const g = genre(it.genre) || {};
        return `<li style="--c:${g.color}"><span class="ts-ill"><img src="img/genre/${g.illust}" alt="" loading="lazy"></span>
          <span class="ts-time">${esc(it.time)}</span><span class="ts-name">${esc(it.label || g.ja)}</span></li>`; }).join("")}
    </ul></div>`).join("") + (TR.pilatesScheduleUrl ? `<p class="center"><a class="link" href="${esc(TR.pilatesScheduleUrl)}" target="_blank" rel="noopener">ピラティスの実施スケジュールはこちら ▶</a></p>` : ""));
  set("trial-notes", TR.notes.map((n) => `<div class="tn"><h3>${esc(n.head)}</h3><p>${br(n.body)}</p>
    ${n.link ? `<a class="link" href="${esc(n.link.url)}"${n.link.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(n.link.text)} ▶</a>` : ""}</div>`).join(""));
})();
