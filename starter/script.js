// アイコンをタップしたときのセリフ。好きに増やしたり書き換えたりしてください。
const greetings = [
  "タップありがとう！",
  "ゆっくり見ていってください",
  "つくったものの話、いつでも聞きます",
  "OSSの話ができる人を探しています",
  "またイベントで会いましょう",
];

// 読み込み画面を出す時間（ミリ秒）。短くしたいときは、この数字を小さくしてください。
const LOADING_MS = 1200;

// 「動きを減らす」設定の端末では、アニメーションを足しません。
const canMove = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// スクロールで現れるブロックは、読み込み画面が出ている間に隠しておきます
if (canMove) {
  document.documentElement.classList.add("js-motion");
}

const stamp = document.querySelector(".stamp");
const image = stamp?.querySelector("img");
const bubble = document.querySelector("#greeting");
const name = document.querySelector(".name");
const loader = document.querySelector("#loader");
const gauge = document.querySelector("#gauge");
const percent = document.querySelector("#percent");
const hop = document.querySelector(".loader-hop");

// アイコン画像がまだ無いときは、代わりの文字に切り替えます。
// starter/assets/avatar.jpg を置けば、自動で画像が表示されます。
if (stamp && image) {
  const showFallback = () => stamp.classList.add("is-fallback");

  image.addEventListener("error", showFallback);

  // スクリプトが動く前に読み込みが終わっていた場合の保険
  if (image.complete && image.naturalWidth === 0) {
    showFallback();
  }
}

// アイコンを押すたびに、次のセリフへ。
if (stamp && bubble) {
  let index = 0;

  stamp.addEventListener("click", () => {
    index = (index + 1) % greetings.length;
    bubble.textContent = greetings[index];

    if (!canMove) return;

    stamp.classList.remove("is-wiggle");
    // 同じアニメーションをもう一度再生させるために、一度リセットします
    void stamp.offsetWidth;
    stamp.classList.add("is-wiggle");
  });

  stamp.addEventListener("animationend", () => {
    stamp.classList.remove("is-wiggle");
  });
}

// ---------- 読み込み画面 ----------

function setProgress(value) {
  gauge?.setAttribute("aria-valuenow", value);

  if (percent) {
    percent.textContent = `${value}%`;
  }
}

function finishLoading() {
  document.documentElement.classList.remove("is-loading");

  if (loader && !canMove) {
    // 動きを減らす設定のときは、フェードもせずに消します
    loader.hidden = true;
  } else if (loader) {
    const hide = () => {
      loader.hidden = true;
    };

    loader.classList.add("is-done");
    loader.addEventListener("animationend", (event) => {
      // 中のキャラクターのアニメーションも上がってくるので、
      // 読み込み画面自身のものだけを見ます
      if (event.target !== loader) return;
      hide();
    });

    // 取りこぼしても必ず消えるようにします
    window.setTimeout(hide, 600);
  }

  startPage();
}

if (!canMove || !loader) {
  // 動きを減らす設定のときは、読み込み画面を出さずにすぐ本文を見せます
  finishLoading();
} else {
  // ゲージ自体はCSSアニメーションが動かします。ここでは長さだけ渡します。
  loader.style.setProperty("--dur", `${LOADING_MS}ms`);

  const fill = loader.querySelector(".loader-fill");
  const startedAt = Date.now();

  let barDone = false;
  let pageReady = document.readyState === "complete";
  let finished = false;

  // 数字はゲージに合わせて数えます（見た目だけの役割です）
  const counter = window.setInterval(() => {
    const ratio = Math.min((Date.now() - startedAt) / LOADING_MS, 1);
    setProgress(Math.round(ratio * 100));

    if (ratio >= 1) {
      window.clearInterval(counter);
    }
  }, 50);

  const tryFinish = () => {
    if (finished || !barDone || !pageReady) return;

    finished = true;
    window.clearInterval(counter);
    setProgress(100);
    hop?.classList.add("is-done");
    window.setTimeout(finishLoading, 380);
  };

  // ゲージが端まで届いたら。
  // 取りこぼしても止まらないよう、時間でも同じ判定をします。
  fill?.addEventListener("animationend", (event) => {
    if (event.animationName !== "fill") return;
    barDone = true;
    tryFinish();
  });

  window.setTimeout(() => {
    barDone = true;
    tryFinish();
  }, LOADING_MS + 80);

  // 画像などの読み込みが終わったら
  window.addEventListener("load", () => {
    pageReady = true;
    tryFinish();
  });

  // 何かが終わらなくても、待たせ続けないようにします
  window.setTimeout(() => {
    barDone = true;
    pageReady = true;
    tryFinish();
  }, LOADING_MS + 2500);
}

// ---------- 本文の演出 ----------

function startPage() {
  if (!canMove) return;

  // 名前を1文字ずつに分けて、順番に出します。
  // 読み上げソフトには元の名前をそのまま伝えます。
  if (name) {
    const text = name.textContent.trim();
    name.setAttribute("aria-label", text);
    name.textContent = "";

    [...text].forEach((character, i) => {
      const span = document.createElement("span");
      span.className = "ch";
      // 空白は inline-block の中で潰れてしまうので、潰れない空白に置き換えます
      span.textContent = /\s/.test(character) ? " " : character;
      span.setAttribute("aria-hidden", "true");
      span.style.animationDelay = `${0.25 + i * 0.04}s`;
      name.appendChild(span);
    });
  }

  // スクロールして見えたブロックから順に現れます。
  const blocks = document.querySelectorAll(".reveal");

  if (blocks.length === 0) return;

  const show = (block) => {
    block.classList.add("is-in");
    observer.unobserve(block);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) show(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );

  blocks.forEach((block) => {
    observer.observe(block);

    // 監視の通知を待たずに、最初から見えているものはすぐ出します
    if (block.getBoundingClientRect().top < window.innerHeight) {
      show(block);
    }
  });

  // 万一、監視が働かなくても本文が隠れたままにならないようにします
  window.setTimeout(() => {
    blocks.forEach(show);
  }, 15000);
}
