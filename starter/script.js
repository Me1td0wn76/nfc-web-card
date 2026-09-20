// アイコンをタップしたときのセリフ。好きに増やしたり書き換えたりしてください。
const greetings = [
  "タップありがとう！",
  "ゆっくり見ていってください",
  "つくったものの話、いつでも聞きます",
  "OSSの話ができる人を探しています",
  "またイベントで会いましょう",
];

// 「動きを減らす」設定の端末では、アニメーションを足しません。
const canMove = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const stamp = document.querySelector(".stamp");
const image = stamp?.querySelector("img");
const bubble = document.querySelector("#greeting");
const name = document.querySelector(".name");

// アイコン画像がまだ無いときは、代わりの文字に切り替えます。
// starter/assets/avatar.png を置けば、自動で画像が表示されます。
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

if (canMove) {
  // 名前を1文字ずつに分けて、順番に出します。
  // 読み上げソフトには元の名前をそのまま伝えます。
  if (name) {
    const text = name.textContent.trim();
    name.setAttribute("aria-label", text);
    name.textContent = "";

    [...text].forEach((character, i) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.textContent = character;
      span.setAttribute("aria-hidden", "true");
      span.style.animationDelay = `${0.25 + i * 0.04}s`;
      name.appendChild(span);
    });
  }

  // スクロールして見えたブロックから順に現れます。
  const blocks = document.querySelectorAll(".reveal");

  if (blocks.length > 0) {
    document.documentElement.classList.add("js-motion");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px" }
    );

    blocks.forEach((block) => observer.observe(block));
  }
}
