const itemNameInput = document.getElementById("itemName");
const itemCategoryInput = document.getElementById("itemCategory");
const addButton = document.getElementById("addButton");
const hidePurchasedCheckbox = document.getElementById("hidePurchased");
const sortButton = document.getElementById("sortButton");

const shoppingList = document.getElementById("shoppingList");
const currentTabTitle = document.getElementById("currentTabTitle");

const templatePanel = document.getElementById("templatePanel");
const shoppingPanel = document.getElementById("shoppingPanel");
const templateList = document.getElementById("templateList");

const templateNameInput = document.getElementById("templateName");
const templateCategoryInput = document.getElementById("templateCategory");
const addTemplateButton = document.getElementById("addTemplateButton");

const installArea = document.getElementById("installArea");
const installButton = document.getElementById("installButton");
const closeInstallButton = document.getElementById("closeInstallButton");

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

function setActiveTab(tabName) {
  activeTab = tabName;

  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });

  if (tabName === "テンプレ") {
    shoppingPanel.hidden = true;
    templatePanel.hidden = false;
  } else {
    shoppingPanel.hidden = false;
    templatePanel.hidden = true;
    currentTabTitle.textContent = tabName;
  }

  render();
}

function render() {
  if (activeTab === "テンプレ") {
    renderTemplates();
  } else {
    renderItems();
  }
}

function renderItems() {
  shoppingList.innerHTML = "";

  let displayItems = items.filter((item) => item.category === activeTab);

  if (hidePurchasedCheckbox.checked) {
    displayItems = displayItems.filter((item) => !item.checked);
  }

  if (!displayItems.length) {
    shoppingList.innerHTML = `<div class="empty-message">表示する商品がありません</div>`;
    return;
  }

  const group = document.createElement("div");
  group.className = "item-list-group";

  displayItems.forEach((item) => {
    const originalIndex = items.findIndex((originalItem) => originalItem.id === item.id);

    const row = document.createElement("div");
    row.className = "list-item";

    row.innerHTML = `
      <div class="item-left">
        <input type="checkbox" ${item.checked ? "checked" : ""} data-index="${originalIndex}" class="check-box">
        <span class="item-name ${item.checked ? "checked" : ""}">${item.name}</span>
      </div>
      <button class="delete-btn" type="button" data-index="${originalIndex}" aria-label="削除">🗑</button>
    `;

    group.appendChild(row);
  });

  shoppingList.appendChild(group);
  attachItemEvents();
}

function renderTemplates() {
  templateList.innerHTML = "";

  sortTemplates();

  if (!templates.length) {
    templateList.innerHTML = `<div class="empty-message">テンプレがありません</div>`;
    return;
  }

  categoryNames.forEach((category) => {
    const categoryTemplates = templates.filter((template) => template.category === category);

    if (!categoryTemplates.length) return;

    const section = document.createElement("section");
    section.className = "template-category-group";

    const heading = document.createElement("h3");
    heading.className = "group-title";
    heading.textContent = category;

    const chipWrap = document.createElement("div");
    chipWrap.className = "template-chip-wrap";

    categoryTemplates.forEach((template, indexInCategory) => {
      const sameCategoryItems = templates.filter((t) => t.category === category);
      const target = sameCategoryItems[indexInCategory];
      const originalIndex = templates.findIndex(
        (t, i) =>
          t.name === target.name &&
          t.category === target.category &&
          templates.slice(0, i + 1).filter(
            (x) => x.name === target.name && x.category === target.category
          ).length ===
          sameCategoryItems
            .slice(0, indexInCategory + 1)
            .filter((x) => x.name === target.name && x.category === target.category).length
      );

      const chip = document.createElement("button");
      chip.className = "template-chip";
      chip.type = "button";
      chip.textContent = template.name;
      chip.addEventListener("click", () => {
        items.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: template.name,
          category: template.category,
          checked: false
        });
        saveItems();
        sortItems();
        if (activeTab !== "テンプレ") {
          renderItems();
        }
      });

      const manageRow = document.createElement("div");
      manageRow.className = "template-manage-item";
      manageRow.innerHTML = `
        <div class="template-meta">
          <span class="template-item-name">${template.name}</span>
          <span class="template-item-category">${template.category}</span>
        </div>
        <button class="template-delete-btn" type="button" data-index="${originalIndex}" aria-label="テンプレ削除">🗑</button>
      `;

      chipWrap.appendChild(chip);
      section.appendChild(heading);
      section.appendChild(chipWrap);

      if (!section.querySelector(".template-manage-list")) {
        const list = document.createElement("div");
        list.className = "template-manage-list";
        section.appendChild(list);
      }

      section.querySelector(".template-manage-list").appendChild(manageRow);
    });

    templateList.appendChild(section);
  });

  attachTemplateEvents();
}

function attachItemEvents() {
  document.querySelectorAll(".check-box").forEach((box) => {
    box.addEventListener("change", (event) => {
      const index = Number(event.target.dataset.index);
      items[index].checked = event.target.checked;
      saveItems();
      renderItems();
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      items.splice(index, 1);
      saveItems();
      renderItems();
    });
  });
}

function attachTemplateEvents() {
  document.querySelectorAll(".template-delete-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.index);
      templates.splice(index, 1);
      saveTemplates();
      renderTemplates();
    });
  });
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./service-worker.js");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    });
  }
}

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isInstallDismissed() {
  return localStorage.getItem(INSTALL_DISMISSED_KEY) === "true";
}

function showInstallArea() {
  installArea.hidden = false;
}

function hideInstallArea() {
  installArea.hidden = true;
}

function setupInstallPrompt() {
  if (isStandaloneMode()) {
    hideInstallArea();
    return;
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;

    if (!isInstallDismissed()) {
      showInstallArea();
    }
  });

  closeInstallButton.addEventListener("click", () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true");
    hideInstallArea();
  });

  installButton.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    hideInstallArea();
  });

  window.addEventListener("appinstalled", () => {
    localStorage.removeItem(INSTALL_DISMISSED_KEY);
    hideInstallArea();
  });
}

addButton.addEventListener("click", () => {
  const name = itemNameInput.value.trim();
  const category = normalizeCategory(itemCategoryInput.value);

  if (!name) {
    alert("商品名を入力してください");
    return;
  }

  items.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name,
    category,
    checked: false
  });

  saveItems();
  sortItems();

  itemNameInput.value = "";
  itemCategoryInput.value = category;

  if (activeTab !== category && activeTab !== "テンプレ") {
    setActiveTab(category);
  } else {
    renderItems();
  }
});

addTemplateButton.addEventListener("click", () => {
  const name = templateNameInput.value.trim();
  const category = normalizeCategory(templateCategoryInput.value);

  if (!name) {
    alert("テンプレ名を入力してください");
    return;
  }

  templates.push({
    name,
    category
  });

  saveTemplates();
  sortTemplates();
  templateNameInput.value = "";
  templateCategoryInput.value = category;
  renderTemplates();
});

hidePurchasedCheckbox.addEventListener("change", () => {
  if (activeTab !== "テンプレ") {
    renderItems();
  }
});

sortButton.addEventListener("click", () => {
  sortItems();
  saveItems();
  if (activeTab !== "テンプレ") {
    renderItems();
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

registerServiceWorker();
setupInstallPrompt();
sortItems();
sortTemplates();
setActiveTab("食品");