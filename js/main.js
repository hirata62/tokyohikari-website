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
  var reveals = document.querySelectorAll(".reveal, .reveal-clip");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reveals.length && !reduce && "IntersectionObserver" in window) {
    var revealOnIntersect = function (entry, observer) {
      var el = entry.target.__revealEl || entry.target;
      el.classList.add("is-visible");
      // reveal-clip: 動画側の合図(is-ready)が来なくても3秒後には必ず開く保険
      if (el.classList.contains("reveal-clip")) {
        setTimeout(function () {
          el.classList.add("is-ready");
        }, 3000);
      }
      observer.unobserve(entry.target);
    };
    // 通常のフェードイン系（.reveal）は画面下端で早めに発火させる
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) revealOnIntersect(entry, io);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    // CTAカーテン(reveal-clip)は画面下端で早く開き切ると演出を見逃しやすいため、
    // 要素が画面の中ほど（下から約30%）まで入ってから開くよう、専用トリガーで監視する
    var ioClip = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) revealOnIntersect(entry, ioClip);
        });
      },
      { threshold: 0, rootMargin: "0px 0px -30% 0px" }
    );
    reveals.forEach(function (el) {
      // clip-pathで初期の可視面積がゼロの要素は、ChromeのIntersectionObserverが
      // 永久に「非交差」と判定するため、クリップされていない親セクションを代理で監視する
      if (el.classList.contains("reveal-clip")) {
        var sentinel = el.closest(".cta-band") || el;
        sentinel.__revealEl = el;
        ioClip.observe(sentinel);
      } else {
        io.observe(el);
      }
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
            var v = entry.target.__lazyVideo || entry.target;
            if (v.hasAttribute("data-src")) {
              v.src = v.getAttribute("data-src");
              v.removeAttribute("data-src");
              v.addEventListener("playing", function () {
                v.classList.add("is-playing");
                var frame = v.closest(".reveal-clip");
                if (frame) frame.classList.add("is-ready");
              }, { once: true });
              v.addEventListener("error", function () {
                var frame = v.closest(".reveal-clip");
                if (frame) frame.classList.add("is-ready");
              }, { once: true });
              v.play().catch(function () {});
            }
            vio.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "300px 0px" }
    );
    lazyVideos.forEach(function (v) {
      // クリップされた額装内のvideoは、クリップされていない親セクションを代理で監視
      var sentinel = v.closest(".reveal-clip") ? (v.closest(".cta-band") || v) : v;
      sentinel.__lazyVideo = v;
      vio.observe(sentinel);
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

  /* ---- アプリ切替・タブ復帰時に背景動画の再生を再開（スマホは復帰時に自動再開されないことがある） ---- */
  if (!reduce) {
    // pausedがfalseのまま映像だけ凍るケースがあるため、pausedは見ずに常にplay()を呼ぶ
    // （再生中の動画へのplay()は無害）。失敗時はデコーダ破棄とみなし読み込み直して再挑戦
    var resumeVideo = function (v) {
      if (!v.currentSrc) return;
      var p = v.play();
      if (p && p.catch) {
        p.catch(function () {
          try {
            v.load();
            v.play().catch(function () {});
          } catch (e) {}
        });
      }
    };
    var resumeBackgroundVideos = function () {
      if (document.visibilityState === "hidden") return;
      document.querySelectorAll(".hero__video, .cta-band__video, .media-band__video").forEach(resumeVideo);
      // メニュー背景動画は「メニューが開いているときだけ」再開する（閉時停止は仕様）
      var menuVideo = document.querySelector(".gnav.is-open .gnav__video");
      if (menuVideo) resumeVideo(menuVideo);
      // 復帰直後はメディア再開に失敗することがあるため、少し待ってもう一度
      setTimeout(function () {
        document.querySelectorAll(".hero__video, .cta-band__video, .media-band__video").forEach(resumeVideo);
      }, 500);
    };
    document.addEventListener("visibilitychange", resumeBackgroundVideos);
    window.addEventListener("pageshow", resumeBackgroundVideos);
    window.addEventListener("focus", resumeBackgroundVideos);
  }

  /* ---- 数字バンド（トップページのみ）: 表示時にフェードイン＋カウントアップ ---- */
  var statsBand = document.querySelector(".stats-band");
  if (statsBand) {
    var statsCounts = statsBand.querySelectorAll(".stats-item__num[data-value]");
    var statsFormat = function (el, value) {
      var d = parseInt(el.getAttribute("data-decimals"), 10) || 0;
      return value.toLocaleString("ja-JP", { minimumFractionDigits: d, maximumFractionDigits: d });
    };
    var statsSetFinal = function () {
      statsCounts.forEach(function (el) {
        el.textContent = statsFormat(el, Number(el.getAttribute("data-value")));
      });
    };
    var statsPlay = function () {
      var start = null;
      var duration = 1200;
      var tick = function (now) {
        if (start === null) start = now;
        var p = Math.min((now - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        statsCounts.forEach(function (el) {
          if (el.hasAttribute("data-static")) return;
          var d = parseInt(el.getAttribute("data-decimals"), 10) || 0;
          var v = Number(el.getAttribute("data-value")) * eased;
          el.textContent = statsFormat(el, d ? v : Math.round(v));
        });
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          statsSetFinal();
        }
      };
      requestAnimationFrame(tick);
    };
    if (reduce || !("IntersectionObserver" in window)) {
      statsBand.classList.add("is-visible");
      statsSetFinal();
    } else {
      var statsIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            statsBand.classList.add("is-visible");
            statsPlay();
            statsIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      statsIo.observe(statsBand);
    }
  }

  /* ---- お問い合わせフォーム送信（contact.htmlのみ存在） ---- */
  var cform = document.getElementById("contact-form");
  if (cform) {
    var cformReady = false;
    var tsErrorCount = 0;
    // Turnstileの認証（自動・非表示）が終わるまでボタンを押せなくし、
    // 「missing-input-response」（トークン未生成のまま送信）を防ぐ
    window.onTurnstileReady = function () {
      tsErrorCount = 0;
      cformReady = true;
      var btn = document.getElementById("cform-submit");
      var warn = document.getElementById("cform-ts-warning");
      if (warn) warn.hidden = true;
      if (btn && !btn.dataset.submitting) {
        btn.disabled = false;
        btn.textContent = "送信する";
      }
    };
    // トークンの有効期限切れ時は再認証を待つ（Turnstileが自動で再試行する）
    window.onTurnstileExpired = function () {
      cformReady = false;
      var btn = document.getElementById("cform-submit");
      if (btn && !btn.dataset.submitting) {
        btn.disabled = true;
        btn.textContent = "認証中…";
      }
    };
    // Turnstileが読み込めない・応答が来ない環境向けの案内表示。
    // トークンが無い状態でボタンを解放すると必ずサーバー側で拒否される（missing-input-response）だけなので、
    // ボタンは有効化せず、送信前にはっきり原因と代替連絡手段を伝える
    var showTurnstileWarning = function (code) {
      if (cformReady) return;
      var btn = document.getElementById("cform-submit");
      var warn = document.getElementById("cform-ts-warning");
      if (warn) {
        warn.hidden = false;
        // 診断用: エラーコードを画面にも出す（原因特定用。落ち着いたら削除予定）
        if (code) {
          var codeEl = document.getElementById("cform-ts-code");
          if (!codeEl) {
            codeEl = document.createElement("span");
            codeEl.id = "cform-ts-code";
            warn.appendChild(codeEl);
          }
          codeEl.textContent = " [診断コード: " + code + "]";
        }
      }
      if (btn) btn.textContent = "認証に失敗しました";
    };
    window.onTurnstileScriptError = function () { showTurnstileWarning(); };
    // 一時的なチャレンジ失敗（600010等）はウィジェットのリセットで自己回復することが多い。
    // 回復の途中で警告を出すとユーザーを不安にさせるため、エラー回数では警告を出さず、
    // バックオフしながら自動再試行を続ける。警告表示は下の最終タイムアウトに一本化する。
    window.onTurnstileError = function () {
      tsErrorCount++;
      if (tsErrorCount > 8) return true; // 十分再試行しても回復しなければ諦める（警告は下で表示済み）
      var retryDelay = Math.min(2000 * tsErrorCount, 8000); // 2s→4s→6s→8s上限でバックオフ
      setTimeout(function () {
        if (!cformReady && window.turnstile) window.turnstile.reset();
      }, retryDelay);
      return true; // true を返し「エラーは処理済み」と伝え、Turnstile側の既定リトライと二重実行になるのを防ぐ
    };
    // 再試行を続けても一定時間トークンが得られない場合のみ、警告と代替連絡手段を表示
    setTimeout(function () { showTurnstileWarning(); }, 25000);

    cform.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!cform.reportValidity()) return;
      var btn = document.getElementById("cform-submit");
      var err = document.getElementById("cform-error");
      err.hidden = true;
      btn.disabled = true;
      btn.dataset.submitting = "1";
      btn.textContent = "送信中…";
      fetch("/api/contact", { method: "POST", body: new FormData(cform) })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data.ok) throw new Error(data.error || "failed");
          cform.hidden = true;
          var done = document.getElementById("cform-done");
          done.hidden = false;
          // フォーム（縦に長い）が完了メッセージ（短い）に差し替わると
          // ページ全体が縮んでスクロール位置がずれるため、明示的に合わせる
          done.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
        })
        .catch(function () {
          err.hidden = false;
          delete btn.dataset.submitting;
          btn.disabled = false;
          btn.textContent = "送信する";
          if (window.turnstile) window.turnstile.reset();
        });
    });
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
