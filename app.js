const itemNameInput = document.getElementById("itemName");
const itemCategoryInput = document.getElementById("itemCategory");
const addButton = document.getElementById("addButton");
const hidePurchasedCheckbox = document.getElementById("hidePurchased");
const sortButton = document.getElementById("sortButton");

const shoppingInputCard = document.getElementById("shoppingInputCard");
const shoppingList = document.getElementById("shoppingList");
const currentTabTitle = document.getElementById("currentTabTitle");

const currentTemplateTitle = document.getElementById("currentTemplateTitle");
const currentTemplateChips = document.getElementById("currentTemplateChips");

const templateTopCard = document.getElementById("templateTopCard");
const templatePanel = document.getElementById("templatePanel");
const shoppingPanel = document.getElementById("shoppingPanel");
const templateList = document.getElementById("templateList");

const templateNameInput = document.getElementById("templateName");
const templateCategoryInput = document.getElementById("templateCategory");
const addTemplateButton = document.getElementById("addTemplateButton");

const installArea = document.getElementById("installArea");
const installButton = document.getElementById("installButton");
const closeInstallButton = document.getElementById("closeInstallButton");

const toast = document.getElementById("toast");

const tabButtons = document.querySelectorAll(".tab-button");

const categoryNames = ["食品", "調味料", "日用品", "ドラッグストア", "その他"];

const categoryOrder = {
  "食品": 1,
  "調味料": 2,
  "日用品": 3,
  "ドラッグストア": 4,
  "その他": 5
};

const defaultTemplates = [
  { name: "卵", category: "食品" },
  { name: "バナナ", category: "食品" },
  { name: "牛乳", category: "食品" },
  { name: "レンコン（真空パック）", category: "食品" },
  { name: "お茶", category: "食品" },
  { name: "ごぼう", category: "食品" },
  { name: "にんにく（チューブ）", category: "調味料" },
  { name: "わさび（チューブ）", category: "調味料" },
  { name: "しょうが（チューブ）", category: "調味料" },
  { name: "マヨネーズ", category: "調味料" },
  { name: "ソース", category: "調味料" },
  { name: "醤油", category: "調味料" },
  { name: "だしの素", category: "調味料" },
  { name: "綿棒", category: "日用品" }
];

const INSTALL_DISMISSED_KEY = "installBannerDismissed";

let items = JSON.parse(localStorage.getItem("shoppingItems")) || [];
let templates = JSON.parse(localStorage.getItem("shoppingTemplates")) || [];
let deferredPrompt = null;
let activeTab = "食品";

normalizeOldCategories();

if (!templates.length) {
  templates = defaultTemplates;
  saveTemplates();
}

/* ======================
   トースト通知
====================== */
let toastTimer = null;

function showToast(message) {
  if (!toast) return;

  toast.textContent = message;
  toast.hidden = false;

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.hidden = true;
    }, 200);
  }, 1800);
}

/* ======================
   データ整形
====================== */
function normalizeOldCategories() {
  items = items.map((item) => ({
    ...item,
    category: normalizeCategory(item.category)
  }));

  templates = templates.map((template) => ({
    ...template,
    category: normalizeCategory(template.category)
  }));

  saveItems();
  saveTemplates();
}

function normalizeCategory(category) {
  if (category === "食品（冷凍）") return "食品";
  if (category === "化粧品") return "ドラッグストア";
  return category;
}

function saveItems() {
  localStorage.setItem("shoppingItems", JSON.stringify(items));
}

function saveTemplates() {
  localStorage.setItem("shoppingTemplates", JSON.stringify(templates));
}

/* ======================
   ソート
====================== */
function sortItems() {
  items.sort((a, b) => {
    const aOrder = categoryOrder[a.category] || 999;
    const bOrder = categoryOrder[b.category] || 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, "ja");
  });
}

function sortTemplates() {
  templates.sort((a, b) => {
    const aOrder = categoryOrder[a.category] || 999;
    const bOrder = categoryOrder[b.category] || 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name, "ja");
  });
}

/* ======================
   タブ制御
====================== */
function setActiveTab(tabName) {
  activeTab = tabName;

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  const isTemplateTab = tabName === "テンプレ";

  shoppingInputCard.hidden = isTemplateTab;
  shoppingPanel.hidden = isTemplateTab;

  templateTopCard.hidden = !isTemplateTab;
  templatePanel.hidden = !isTemplateTab;

  if (!isTemplateTab) {
    currentTabTitle.textContent = tabName;
    currentTemplateTitle.textContent = tabName;
  }

  render();
}

/* ======================
   描画
====================== */
function render() {
  if (activeTab === "テンプレ") {
    renderTemplates();
  } else {
    renderCurrentCategoryTemplates();
    renderItems();
  }
}

/* テンプレチップ（各カテゴリ） */
function renderCurrentCategoryTemplates() {
  currentTemplateChips.innerHTML = "";

  const filteredTemplates = templates.filter(t => t.category === activeTab);

  if (!filteredTemplates.length) {
    currentTemplateChips.innerHTML = `<div class="empty-message">テンプレがありません</div>`;
    return;
  }

  filteredTemplates.forEach((template) => {
    const chip = document.createElement("button");
    chip.className = "template-chip";
    chip.textContent = template.name;

    chip.onclick = () => {
      items.push({
        id: Date.now(),
        name: template.name,
        category: template.category,
        checked: false
      });

      saveItems();
      sortItems();
      renderItems();

      showToast(`${template.name} を追加しました`);
    };

    currentTemplateChips.appendChild(chip);
  });
}

/* 商品リスト */
function renderItems() {
  shoppingList.innerHTML = "";

  let displayItems = items.filter(i => i.category === activeTab);

  if (hidePurchasedCheckbox.checked) {
    displayItems = displayItems.filter(i => !i.checked);
  }

  if (!displayItems.length) {
    shoppingList.innerHTML = `<div class="empty-message">表示する商品がありません</div>`;
    return;
  }

  displayItems.forEach((item) => {
    const row = document.createElement("div");
    row.className = "list-item";

    row.innerHTML = `
      <div class="item-left">
        <input type="checkbox" ${item.checked ? "checked" : ""}>
        <span class="item-name ${item.checked ? "checked" : ""}">${item.name}</span>
      </div>
      <button class="delete-btn">🗑</button>
    `;

    const checkbox = row.querySelector("input");
    const deleteBtn = row.querySelector("button");

    checkbox.onchange = () => {
      item.checked = checkbox.checked;
      saveItems();
      renderItems();
    };

    deleteBtn.onclick = () => {
      items = items.filter(i => i.id !== item.id);
      saveItems();
      renderItems();
    };

    shoppingList.appendChild(row);
  });
}

/* テンプレ管理 */
function renderTemplates() {
  templateList.innerHTML = "";

  sortTemplates();

  categoryNames.forEach((category) => {
    const list = templates.filter(t => t.category === category);
    if (!list.length) return;

    const section = document.createElement("section");

    section.innerHTML = `<h3>${category}</h3>`;

    list.forEach((template) => {
      const row = document.createElement("div");
      row.className = "list-item";

      row.innerHTML = `
        <span>${template.name}</span>
        <button>🗑</button>
      `;

      row.querySelector("button").onclick = () => {
        templates = templates.filter(t => t !== template);
        saveTemplates();
        renderTemplates();
      };

      section.appendChild(row);
    });

    templateList.appendChild(section);
  });
}

/* ======================
   イベント
====================== */
addButton.onclick = () => {
  const name = itemNameInput.value.trim();
  const category = itemCategoryInput.value;

  if (!name) return;

  items.push({
    id: Date.now(),
    name,
    category,
    checked: false
  });

  itemNameInput.value = "";

  saveItems();
  sortItems();
  renderItems();

  showToast(`${name} を追加しました`);
};

addTemplateButton.onclick = () => {
  const name = templateNameInput.value.trim();
  const category = templateCategoryInput.value;

  if (!name) return;

  templates.push({ name, category });

  templateNameInput.value = "";

  saveTemplates();
  renderTemplates();

  showToast("テンプレ追加しました");
};

tabButtons.forEach(btn => {
  btn.onclick = () => setActiveTab(btn.dataset.tab);
});

/* ======================
   初期化
====================== */
sortItems();
sortTemplates();
setActiveTab("食品");