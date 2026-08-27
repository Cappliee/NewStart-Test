const ENDPOINT = "https://script.google.com/macros/s/AKfycby_ig-LZE7uoj-kr9NLbAmylZhn7kr9YeiWxir4vG3dg6r0knWMYE5BKBH8t_imQ84P/exec";
// 若要把學生答案自動寫入 Google 試算表，將上面的 ENDPOINT 換成你的 Google Apps Script Web App URL。
// 留空也可以使用：測驗完成後答案不會離開學生裝置。

const form = document.getElementById("quizForm");
const steps = [...document.querySelectorAll(".step")];
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
let current = 0;

startBtn.addEventListener("click", () => {
  welcome.classList.remove("active");
  quiz.classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
  updateStep();
});

document.querySelectorAll(".option-grid").forEach(group => {
  group.querySelectorAll(".choice").forEach(btn => {
    btn.addEventListener("click", () => {
      group.querySelectorAll(".choice").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      const hidden = group.parentElement.querySelector(`input[name="${group.dataset.radioGroup}"]`);
      if (hidden) hidden.value = btn.dataset.value;
      clearError();
    });
  });
});

document.querySelectorAll(".check").forEach(label => {
  const input = label.querySelector("input");
  input.addEventListener("change", clearError);
});

function updateStep(){
  steps.forEach((s,i)=>s.classList.toggle("active", i===current));
  const pct = ((current+1)/steps.length)*100;
  progress.style.width = pct + "%";
  progressText.textContent = `${current+1} / ${steps.length}`;
  prevBtn.hidden = current===0;
  nextBtn.hidden = current===steps.length-1;
  submitBtn.hidden = current!==steps.length-1;
  clearError();
  window.scrollTo({top:0, behavior:"smooth"});
}

function clearError(){ errorEl.textContent=""; }

function requiredInputsValid(){
  if(current !== 0 && current !== 1) return true;
  const required = steps[current].querySelectorAll("[required]");
  for(const el of required){
    if(!el.value.trim()){
      el.focus();
      errorEl.textContent = "這一頁還有一個必填欄位，完成它再往下走就好。";
      return false;
    }
  }
  return true;
}

nextBtn.addEventListener("click", () => {
  if(!requiredInputsValid()) return;
  current++;
  updateStep();
});
prevBtn.addEventListener("click", () => {
  current--;
  updateStep();
});

function getChecked(groupName){
  return [...document.querySelectorAll(`[data-check-group="${groupName}"] input:checked`)].map(x=>x.value);
}

function collectData(){
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.favorites = getChecked("favorites");
  data.expectations = getChecked("expectations");
  data.safety = getChecked("safety");
  data.timestamp = new Date().toISOString();
  data.userAgent = navigator.userAgent;
  data.source = "GitHub Pages";
  return data;
}

function classify(data){
  const score = {
    "故事旅人": 0,
    "思考探險家": 0,
    "文字創作者": 0,
    "成長行動派": 0
  };

  const relationMap = {
    "很熟的老朋友": {"故事旅人":2, "文字創作者":1},
    "偶爾聊天的朋友": {"故事旅人":1, "成長行動派":1},
    "想靠近但不知道怎麼靠近": {"思考探險家":2, "故事旅人":1},
    "看起來很熟其實還好": {"成長行動派":1, "思考探險家":1},
    "有一點害怕的對象": {"成長行動派":2},
    "還在互相認識": {"思考探險家":1, "故事旅人":1}
  };

  const rel = relationMap[data.chineseRelationship] || {};
  Object.entries(rel).forEach(([k,v]) => score[k] += v);

  const fav = data.favorites || [];
  fav.forEach(x => {
    if(["小說／散文","閱讀文章","聽故事／作品背景"].includes(x)) score["故事旅人"] += 2;
    if(["詩","古文","影片／圖片延伸"].includes(x)) score["思考探險家"] += 1;
    if(["寫作","討論與發表"].includes(x)) score["文字創作者"] += 2;
  });

  const exp = data.expectations || [];
  exp.forEach(x => {
    if(["更會表達自己的想法","更敢在大家面前說話"].includes(x)) score["文字創作者"] += 2;
    if(["認識更多有趣的作品","找到真正喜歡的作家／作品"].includes(x)) score["故事旅人"] += 2;
    if(["閱讀能力變強"].includes(x)) score["思考探險家"] += 2;
    if(["更會寫文章"].includes(x)) score["文字創作者"] += 2;
    if(["面對考試更有信心","重新喜歡上國文"].includes(x)) score["成長行動派"] += 2;
  });

  const text = [
    data.selfWords || "",
    data.classHope || "",
    data.whyLoveChinese || ""
  ].join(" ");

  if(/故事|小說|人物|作品|閱讀|共鳴/.test(text)) score["故事旅人"] += 1;
  if(/想法|思考|為什麼|理解|問題|探索/.test(text)) score["思考探險家"] += 1;
  if(/寫|說|表達|發表|創作|文字/.test(text)) score["文字創作者"] += 1;
  if(/進步|考試|成績|能力|實用|變好/.test(text)) score["成長行動派"] += 1;

  // 有平手時採用穩定順序，讓結果不飄。
  const order = ["故事旅人","思考探險家","文字創作者","成長行動派"];
  return order.sort((a,b) => score[b] - score[a])[0];
}

const typeInfo = {
  "故事旅人": {
    emoji:"📖",
    tagline:"你會在文字裡尋找故事，也在故事裡尋找自己",
    desc:"你可能很在意一篇文章有沒有讓你產生畫面與共鳴。希望未來的國文課，能陪你遇見一些真的會留下來的故事。"
  },
  "思考探險家": {
    emoji:"🔎",
    tagline:"你喜歡的不只是答案，而是答案背後的「為什麼」",
    desc:"你可能喜歡追問、比較與換個角度想想看。國文課對你來說，也許可以是一場小小的思想旅行。"
  },
  "文字創作者": {
    emoji:"✍️",
    tagline:"你正在練習，把腦中的聲音變成自己的文字",
    desc:"你可能在意表達、分享與創作。希望這三年裡，你能越來越知道：自己的聲音，其實值得被留下。"
  },
  "成長行動派": {
    emoji:"🌱",
    tagline:"你希望學到的東西，真的能讓自己變得更好",
    desc:"你很在意國文能不能帶來實際的成長。考試、閱讀、寫作之外，希望你最後會發現，語文能力其實是一種帶得走的力量。"
  }
};

async function sendData(data){
  if(!ENDPOINT) return {ok:true, localOnly:true};
  try{
    await fetch(ENDPOINT, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(data)
    });
    return {ok:true, localOnly:false};
  }catch(err){
    return {ok:false, error:err};
  }
}

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  if(!requiredInputsValid()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "正在交出第一頁…";
  const data = collectData();
  const type = classify(data);
  const response = await sendData(data);

  quiz.classList.remove("active");
  result.classList.add("active");
  document.getElementById("resultName").textContent = data.preferredName?.trim() || data.name;
  document.getElementById("typeEmoji").textContent = typeInfo[type].emoji;
  document.getElementById("typeTitle").textContent = type;
  document.getElementById("typeTagline").textContent = typeInfo[type].tagline;
  document.getElementById("typeDesc").textContent = typeInfo[type].desc;

  const status = document.getElementById("submitStatus");
  if(response.localOnly){
    status.textContent = "這份答案已完成；目前網站未設定集中收件功能。";
  }else if(response.ok){
    status.textContent = "你的第一頁已送出給老師，謝謝你。";
  }else{
    status.textContent = "頁面已完成，但目前連線收件似乎沒有成功，請告知老師。";
  }
  window.scrollTo({top:0, behavior:"smooth"});
});
