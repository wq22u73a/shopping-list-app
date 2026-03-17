const itemNameInput = document.getElementById("itemName");
const itemCategoryInput = document.getElementById("itemCategory");
const addButton = document.getElementById("addButton");
const templateList = document.getElementById("templateList");
const shoppingList = document.getElementById("shoppingList");
const hidePurchasedCheckbox = document.getElementById("hidePurchased");
const sortButton = document.getElementById("sortButton");

const categoryOrder = {
  "食品": 1,
  "食品（冷凍）": 2,
  "調味料": 3,
  "日用品": 4,
  "化粧品": 5,
  "その他": 6
};

const categoryNames = ["食品", "食品（冷凍）", "調味料", "日用品", "化粧品", "その他"];

const defaultTemplates = [
  { name: "卵", category: "食品" },
  { name: "バナナ", category: "食品" },
  { name: "牛乳", category: "食品" },
  { name: "レンコン（真空パック）", category: "食品" },
  { name: "お茶", category: "食品" },

  { name: "ごぼう", category: "食品（冷凍）" },

  { name: "にんにく（チューブ）", category: "調味料" },
  { name: "わさび（チューブ）", category: "調味料" },
  { name: "しょうが（チューブ）", category: "調味料" },
  { name: "マヨネーズ", category: "調味料" },
  { name: "ソース", category: "調味料" },
  { name: "醤油", category: "調味料" },
  { name: "だしの素", category: "調味料" },

  { name: "綿棒", category: "日用品" }
];

let items = JSON.parse(localStorage.getItem("shoppingItems")) || [];
let templates = JSON.parse(localStorage.getItem("shoppingTemplates"));

if (!templates || !Array.isArray(templates) || templates.length === 0) {
  templates = defaultTemplates;
  localStorage.setItem("shoppingTemplates", JSON.stringify(templates));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        await navigator.serviceWorker.register("./service-worker.js");
        console.log("Service Worker registered");
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    });
  }
}

function saveItems() {
  localStorage.setItem("shoppingItems", JSON.stringify(items));
}

function getTemplates() {
  const savedTemplates = JSON.parse(localStorage.getItem("shoppingTemplates"));
  if (savedTemplates && Array.isArray(savedTemplates)) {
    return savedTemplates;
  }
  return defaultTemplates;
}

function sortItemsByCategory() {
  items.sort((a, b) => {
    const categoryA = categoryOrder[a.category] || 999;
    const categoryB = categoryOrder[b.category] || 999;

    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    return a.name.localeCompare(b.name, "ja");
  });
}

function sortTemplatesByCategory(list) {
  return [...list].sort((a, b) => {
    const categoryA = categoryOrder[a.category] || 999;
    const categoryB = categoryOrder[b.category] || 999;

    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    return a.name.localeCompare(b.name, "ja");
  });
}

function renderTemplates() {
  templateList.innerHTML = "";

  const currentTemplates = sortTemplatesByCategory(getTemplates());

  if (currentTemplates.length === 0) {
    templateList.innerHTML = `<div class="empty-message">テンプレがありません</div>`;
    return;
  }

  categoryNames.forEach((category) => {
    const categoryTemplates = currentTemplates.filter(tpl => tpl.category === category);

    if (categoryTemplates.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "category-section";

    const heading = document.createElement("h2");
    heading.className = "category-heading";
    heading.textContent = category;

    const wrap = document.createElement("div");
    wrap.className = "template-chip-wrap";

    categoryTemplates.forEach((tpl) => {
      const chip = document.createElement("button");
      chip.className = "template-item";
      chip.type = "button";
      chip.textContent = tpl.name;

      chip.addEventListener("click", () => {
        items.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: tpl.name,
          category: tpl.category,
          checked: false
        });
        saveItems();
        renderItems();
      });

      wrap.appendChild(chip);
    });

    section.appendChild(heading);
    section.appendChild(wrap);
    templateList.appendChild(section);
  });
}

function renderItems() {
  shoppingList.innerHTML = "";

  let displayItems = [...items];

  if (hidePurchasedCheckbox.checked) {
    displayItems = displayItems.filter(item => !item.checked);
  }

  if (displayItems.length === 0) {
    shoppingList.innerHTML = `<div class="empty-message">表示する商品がありません</div>`;
    return;
  }

  categoryNames.forEach((category) => {
    const categoryItems = displayItems.filter(item => item.category === category);

    if (categoryItems.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "category-section";

    const heading = document.createElement("h2");
    heading.className = "category-heading";
    heading.textContent = category;

    categoryItems.forEach((item) => {
      const originalIndex = items.findIndex(
        (originalItem) => originalItem.id === item.id
      );

      const div = document.createElement("div");
      div.className = "list-item";

      div.innerHTML = `
        <div class="item-left">
          <input type="checkbox" ${item.checked ? "checked" : ""} data-index="${originalIndex}" class="check-box">
          <div class="item-text">
            <span class="item-name ${item.checked ? "checked" : ""}">${item.name}</span>
          </div>
        </div>
        <button class="delete-btn" data-index="${originalIndex}">削除</button>
      `;

      section.appendChild(div);
    });

    shoppingList.appendChild(section);
  });

  attachEvents();
}

function attachEvents() {
  document.querySelectorAll(".check-box").forEach((box) => {
    box.addEventListener("change", (e) => {
      const index = Number(e.target.dataset.index);
      items[index].checked = e.target.checked;
      saveItems();
      renderItems();
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number(e.target.dataset.index);
      items.splice(index, 1);
      saveItems();
      renderItems();
    });
  });
}

addButton.addEventListener("click", () => {
  const name = itemNameInput.value.trim();

  if (!name) {
    alert("商品名を入力してください");
    return;
  }

  items.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: name,
    category: itemCategoryInput.value,
    checked: false
  });

  saveItems();
  renderItems();

  itemNameInput.value = "";
  itemCategoryInput.value = "食品";
});

hidePurchasedCheckbox.addEventListener("change", renderItems);

sortButton.addEventListener("click", () => {
  sortItemsByCategory();
  saveItems();
  renderItems();
});

registerServiceWorker();
sortItemsByCategory();
renderTemplates();
renderItems();