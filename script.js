const ENDPOINT = "https://script.google.com/macros/s/AKfycby_ig-LZE7uoj-kr9NLbAmylZhn7kr9YeiWxir4vG3dg6r0knWMYE5BKBH8t_imQ84P/exec";

document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("quizForm");
  const steps = Array.from(document.querySelectorAll(".step"));

  const welcome = document.getElementById("welcome");
  const quiz = document.getElementById("quiz");
  const result = document.getElementById("result");

  const startBtn = document.getElementById("startBtn");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const submitBtn = document.getElementById("submitBtn");

  const progress = document.getElementById("progress");
  const progressText = document.getElementById("progressText");
  const errorEl = document.getElementById("error");

  const classInput = document.getElementById("className");
  const classLockNote = document.getElementById("classLockNote");
  const classDisplay = document.getElementById("classDisplay");

  const resultName = document.getElementById("resultName");
  const typeEmoji = document.getElementById("typeEmoji");
  const typeTitle = document.getElementById("typeTitle");
  const typeTagline = document.getElementById("typeTagline");
  const typeDesc = document.getElementById("typeDesc");
  const submitStatus = document.getElementById("submitStatus");

  let current = 0;

  /* -------------------------
     班級自動帶入
  ------------------------- */

  const urlClass = new URLSearchParams(window.location.search).get("class");

  if (urlClass && classInput) {

    const normalizedClass = urlClass
      .trim()
      .replace(/班$/u, "");

    if (normalizedClass) {

      classInput.value = normalizedClass;
      classInput.readOnly = true;
      classInput.classList.add("locked");

      if (classLockNote) {
        classLockNote.hidden = false;
      }

      if (classDisplay) {
        classDisplay.textContent = normalizedClass;
      }
    }
  }

  /* -------------------------
     工具
  ------------------------- */

  function clearError() {
    errorEl.textContent = "";
  }

  function updateStep() {

    steps.forEach((step, index) => {
      step.classList.toggle("active", index === current);
    });

    const percent =
      ((current + 1) / steps.length) * 100;

    progress.style.width = percent + "%";
    progressText.textContent =
      `${current + 1} / ${steps.length}`;

    prevBtn.hidden = current === 0;
    nextBtn.hidden =
      current === steps.length - 1;

    submitBtn.hidden =
      current !== steps.length - 1;

    clearError();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function validateCurrentStep() {

    const required =
      steps[current].querySelectorAll("[required]");

    for (const field of required) {

      if (!String(field.value || "").trim()) {

        field.focus();

        errorEl.textContent =
          "這一頁還有一個必填欄位，完成它再往下走就好。";

        return false;
      }
    }

    return true;
  }

  function getChecked(groupName) {

    return Array.from(
      document.querySelectorAll(
        `[data-check-group="${groupName}"] input:checked`
      )
    ).map(input => input.value);
  }

  /* -------------------------
     開始測驗
  ------------------------- */

  startBtn.addEventListener("click", () => {

    welcome.classList.remove("active");
    quiz.classList.add("active");

    current = 0;

    updateStep();
  });

  /* -------------------------
     單選題
  ------------------------- */

  document
    .querySelectorAll(".option-grid")
    .forEach(group => {

      const buttons =
        group.querySelectorAll(".choice");

      buttons.forEach(button => {

        button.addEventListener("click", () => {

          buttons.forEach(item => {
            item.classList.remove("selected");
          });

          button.classList.add("selected");

          const radioName =
            group.dataset.radioGroup;

          const hidden =
            form.querySelector(
              `input[name="${radioName}"]`
            );

          if (hidden) {
            hidden.value =
              button.dataset.value || "";
          }

          clearError();
        });

      });

    });

  /* -------------------------
     複選題
  ------------------------- */

  document
    .querySelectorAll(".check input")
    .forEach(input => {

      input.addEventListener("change", clearError);

    });

  /* -------------------------
     下一頁
  ------------------------- */

  nextBtn.addEventListener("click", () => {

    if (!validateCurrentStep()) {
      return;
    }

    if (current < steps.length - 1) {
      current++;
      updateStep();
    }

  });

  /* -------------------------
     上一頁
  ------------------------- */

  prevBtn.addEventListener("click", () => {

    if (current > 0) {
      current--;
      updateStep();
    }

  });

  /* -------------------------
     整理答案
  ------------------------- */

  function collectData() {

    const formData =
      new FormData(form);

    const data =
      Object.fromEntries(formData.entries());

    data.className =
      String(data.className || "")
        .trim()
        .replace(/班$/u, "");

    data.favorites =
      getChecked("favorites");

    data.expectations =
      getChecked("expectations");

    data.safety =
      getChecked("safety");

    data.timestamp =
      new Date().toISOString();

    return data;
  }

  /* -------------------------
     國文人格
  ------------------------- */

  function classify(data) {

    const score = {
      "故事旅人": 0,
      "思考探險家": 0,
      "文字創作者": 0,
      "成長行動派": 0
    };

    const relationMap = {

      "很熟的老朋友": {
        "故事旅人": 2,
        "文字創作者": 1
      },

      "偶爾聊天的朋友": {
        "故事旅人": 1,
        "成長行動派": 1
      },

      "想靠近但不知道怎麼靠近": {
        "思考探險家": 2,
        "故事旅人": 1
      },

      "看起來很熟其實還好": {
        "思考探險家": 1,
        "成長行動派": 1
      },

      "有一點害怕的對象": {
        "成長行動派": 2
      },

      "還在互相認識": {
        "思考探險家": 1,
        "故事旅人": 1
      }
    };

    const relation =
      relationMap[data.chineseRelationship] || {};

    Object.entries(relation).forEach(
      ([type, points]) => {
        score[type] += points;
      }
    );

    const favorites =
      data.favorites || [];

    favorites.forEach(item => {

      if (
        [
          "小說／散文",
          "閱讀文章",
          "聽故事／作品背景"
        ].includes(item)
      ) {
        score["故事旅人"] += 2;
      }

      if (
        [
          "詩",
          "古文",
          "影片／圖片延伸"
        ].includes(item)
      ) {
        score["思考探險家"] += 1;
      }

      if (
        [
          "寫作",
          "討論與發表"
        ].includes(item)
      ) {
        score["文字創作者"] += 2;
      }
    });

    const expectations =
      data.expectations || [];

    expectations.forEach(item => {

      if (
        [
          "更會表達自己的想法",
          "更敢在大家面前說話"
        ].includes(item)
      ) {
        score["文字創作者"] += 2;
      }

      if (
        [
          "認識更多有趣的作品",
          "找到真正喜歡的作家／作品"
        ].includes(item)
      ) {
        score["故事旅人"] += 2;
      }

      if (item === "閱讀能力變強") {
        score["思考探險家"] += 2;
      }

      if (item === "更會寫文章") {
        score["文字創作者"] += 2;
      }

      if (
        [
          "面對考試更有信心",
          "重新喜歡上國文"
        ].includes(item)
      ) {
        score["成長行動派"] += 2;
      }
    });

    const text = [
      data.selfWords || "",
      data.classHope || "",
      data.whyLoveChinese || ""
    ].join(" ");

    if (
      /故事|小說|人物|作品|閱讀|共鳴/u.test(text)
    ) {
      score["故事旅人"] += 1;
    }

    if (
      /想法|思考|為什麼|理解|問題|探索/u.test(text)
    ) {
      score["思考探險家"] += 1;
    }

    if (
      /寫|說|表達|發表|創作|文字/u.test(text)
    ) {
      score["文字創作者"] += 1;
    }

    if (
      /進步|考試|成績|能力|實用|變好/u.test(text)
    ) {
      score["成長行動派"] += 1;
    }

    const order = [
      "故事旅人",
      "思考探險家",
      "文字創作者",
      "成長行動派"
    ];

    return order.sort(
      (a, b) => score[b] - score[a]
    )[0];
  }

  const typeInfo = {

    "故事旅人": {
      emoji: "📖",
      tagline:
        "你會在文字裡尋找故事，也在故事裡尋找自己",
      desc:
        "你可能很在意一篇文章有沒有讓你產生畫面與共鳴。希望未來的國文課，能陪你遇見一些真的會留下來的故事。"
    },

    "思考探險家": {
      emoji: "🔎",
      tagline:
        "你喜歡的不只是答案，而是答案背後的「為什麼」",
      desc:
        "你可能喜歡追問、比較與換個角度想想看。國文課對你來說，也許可以是一場小小的思想旅行。"
    },

    "文字創作者": {
      emoji: "✍️",
      tagline:
        "你正在練習，把腦中的聲音變成自己的文字",
      desc:
        "你可能在意表達、分享與創作。希望這三年裡，你能越來越知道：自己的聲音，其實值得被留下。"
    },

    "成長行動派": {
      emoji: "🌱",
      tagline:
        "你希望學到的東西，真的能讓自己變得更好",
      desc:
        "你很在意國文能不能帶來實際的成長。考試、閱讀、寫作之外，希望你最後會發現，語文能力其實是一種帶得走的力量。"
    }
  };

  /* -------------------------
     傳送到 Google Sheet
  ------------------------- */

  async function sendData(data) {

    try {

      await fetch(
        ENDPOINT,
        {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type":
              "text/plain;charset=utf-8"
          },
          body: JSON.stringify(data)
        }
      );

      return true;

    } catch (error) {

      console.error(
        "送出資料失敗：",
        error
      );

      return false;
    }
  }

  /* -------------------------
     最後送出
  ------------------------- */

  form.addEventListener("submit", async event => {

    event.preventDefault();

    if (!validateCurrentStep()) {
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent =
      "正在交出第一頁…";

    const data =
      collectData();

    const type =
      classify(data);

    const sent =
      await sendData(data);

    resultName.textContent =
      data.preferredName?.trim() ||
      data.name ||
      "同學";

    typeEmoji.textContent =
      typeInfo[type].emoji;

    typeTitle.textContent =
      type;

    typeTagline.textContent =
      typeInfo[type].tagline;

    typeDesc.textContent =
      typeInfo[type].desc;

    if (sent) {

      submitStatus.textContent =
        "你的第一頁已送出給老師，謝謝你。";

    } else {

      submitStatus.textContent =
        "頁面已完成，但資料傳送似乎失敗了，請告知老師。";
    }

    quiz.classList.remove("active");
    result.classList.add("active");

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  });

});
