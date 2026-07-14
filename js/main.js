/* =========================================================
   東京ひかり不動産 main.js
   - モバイルメニュー開閉
   - ヘッダーのスクロール影
   - スクロールフェードイン（IntersectionObserver）
   ========================================================= */
(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".gnav");
  var body = document.body;

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      body.style.overflow = open ? "hidden" : "";

      // メニュー背景動画: 初回オープンで読み込み、開閉に合わせて再生/停止
      var gv = nav.querySelector(".gnav__video");
      if (gv && !reduce) {
        if (gv.hasAttribute("data-src")) {
          gv.src = gv.getAttribute("data-src");
          gv.removeAttribute("data-src");
          gv.addEventListener("playing", function () {
            gv.classList.add("is-playing");
          }, { once: true });
        }
        if (open) {
          gv.play().catch(function () {});
        } else {
          gv.pause();
        }
      }
    });

    // ナビ内リンクを押したら閉じる
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        body.style.overflow = "";
      });
    });
  }

  /* ---- Header shadow on scroll ---- */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && !reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---- ポリシーカードのマーカー行分割 ----
     タイトルが複数行に折り返された時、各行が同時ではなく
     読み順（1行目→2行目）でマーカーが引かれるようにする */
  if (!reduce) {
    var splitMarkers = function () {
      document.querySelectorAll(".policy-item__marker").forEach(function (marker) {
        var item = marker.closest(".policy-item");
        if (item && item.classList.contains("is-visible")) return; // 発火済みなら従来動作のまま

        var text = marker.textContent;

        // 1) 1文字ずつ span 化し、各文字の縦位置から所属行を判定する
        marker.textContent = "";
        var charSpans = [];
        for (var i = 0; i < text.length; i++) {
          var s = document.createElement("span");
          s.textContent = text.charAt(i);
          marker.appendChild(s);
          charSpans.push(s);
        }
        var lines = [];
        var lastTop = null;
        charSpans.forEach(function (s) {
          var top = Math.round(s.getBoundingClientRect().top);
          if (lastTop === null || Math.abs(top - lastTop) > 2) {
            lines.push("");
            lastTop = top;
          }
          lines[lines.length - 1] += s.textContent;
        });

        // 2) 行単位の span に組み直し、行ごとに遅延をずらす
        marker.textContent = "";
        marker.classList.add("is-split");
        var dur = 0.7 / lines.length; // 合計0.7秒（従来の1行時と同じ体感速度）
        lines.forEach(function (lineText, idx) {
          var line = document.createElement("span");
          line.className = "policy-item__marker-line";
          line.textContent = lineText;
          line.style.transition =
            "background-size " + dur.toFixed(2) + "s var(--ease) " +
            (0.55 + dur * idx).toFixed(2) + "s";
          marker.appendChild(line);
        });
      });
    };
    // フォント読込後に実行（読込前だと折り返し位置がずれるため）
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(splitMarkers);
    } else {
      splitMarkers();
    }
  }

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---- 背景動画の遅延読み込み（data-src → 画面に近づいたら読み込んで再生） ---- */
  var lazyVideos = document.querySelectorAll(".cta-band__video[data-src], .media-band__video[data-src]");
  if (lazyVideos.length && !reduce && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var v = entry.target;
            v.src = v.getAttribute("data-src");
            v.removeAttribute("data-src");
            v.addEventListener("playing", function () {
              v.classList.add("is-playing");
            }, { once: true });
            v.play().catch(function () {});
            vio.unobserve(v);
          }
        });
      },
      { rootMargin: "300px 0px" }
    );
    lazyVideos.forEach(function (v) {
      vio.observe(v);
    });
  }

  /* ---- ヒーロー動画（即時読み込み。reduced-motionでは通信自体を発生させない） ---- */
  var heroVideo = document.querySelector(".hero__video[data-src]");
  if (heroVideo) {
    if (!reduce) {
      // スマホ幅では縦長クロップ版を読み込む（Bシーンのタワー見切れ対策）
      var useMobileSrc =
        window.matchMedia("(max-width: 768px)").matches &&
        heroVideo.hasAttribute("data-src-mobile");
      heroVideo.src = heroVideo.getAttribute(useMobileSrc ? "data-src-mobile" : "data-src");
      heroVideo.removeAttribute("data-src");
      heroVideo.removeAttribute("data-src-mobile");
      heroVideo.addEventListener("error", function () {
        heroVideo.style.display = "none";
        var bg = document.querySelector(".hero__bg");
        if (bg) bg.style.backgroundImage = "url('images/hero.jpg')";
      });
      heroVideo.addEventListener("playing", function () {
        heroVideo.classList.add("is-playing");
      }, { once: true });
      heroVideo.play().catch(function () {});
    }
  }

  /* ---- ヒーロー文字のパララックス退場（スクロールで浮き上がりながらフェード） ---- */
  var heroInner = document.querySelector(".hero__inner");
  if (heroInner && !reduce) {
    var heroTicking = false;
    window.addEventListener("scroll", function () {
      if (heroTicking) return;
      heroTicking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        var h = window.innerHeight;
        if (y <= h) {
          // スクロールより18%速く上へ＋60%地点で完全フェード
          heroInner.style.transform = "translateY(" + (-y * 0.18) + "px)";
          heroInner.style.opacity = String(Math.max(0, 1 - y / (h * 0.6)));
        }
        heroTicking = false;
      });
    }, { passive: true });
  }

  /* ---- ページトップへ戻るボタン（スクロール600px超で表示） ---- */
  var toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "ページの先頭へ戻る");
  toTop.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>';
  document.body.appendChild(toTop);

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  window.addEventListener("scroll", function () {
    toTop.classList.toggle("is-visible", window.scrollY > 600);
  }, { passive: true });
})();
