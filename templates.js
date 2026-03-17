const templateNameInput = document.getElementById("templateName");
const templateCategoryInput = document.getElementById("templateCategory");
const addTemplateButton = document.getElementById("addTemplateButton");
const templateManageList = document.getElementById("templateManageList");

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

function saveTemplates() {
  localStorage.setItem("shoppingTemplates", JSON.stringify(templates));
}

function sortTemplatesByCategory() {
  templates.sort((a, b) => {
    const categoryA = categoryOrder[a.category] || 999;
    const categoryB = categoryOrder[b.category] || 999;

    if (categoryA !== categoryB) {
      return categoryA - categoryB;
    }

    return a.name.localeCompare(b.name, "ja");
  });
}

function renderTemplates() {
  templateManageList.innerHTML = "";

  if (templates.length === 0) {
    templateManageList.innerHTML = `<div class="empty-message">テンプレがありません</div>`;
    return;
  }

  categoryNames.forEach((category) => {
    const categoryTemplates = templates.filter(tpl => tpl.category === category);

    if (categoryTemplates.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.className = "category-section";

    const heading = document.createElement("h2");
    heading.className = "category-heading";
    heading.textContent = category;

    categoryTemplates.forEach((tpl, indexInCategory) => {
      const originalIndex = templates.findIndex(
        (item, idx) =>
          item.name === tpl.name &&
          item.category === tpl.category &&
          idx >= 0 &&
          templates.slice(0, idx + 1).filter(
            t => t.name === tpl.name && t.category === tpl.category
          ).length === categoryTemplates
            .slice(0, indexInCategory + 1)
            .filter(t => t.name === tpl.name && t.category === tpl.category).length
      );

      const div = document.createElement("div");
      div.className = "template-manage-item";

      div.innerHTML = `
        <div class="template-manage-left">
          <span class="template-name">${tpl.name}</span>
          <span class="template-category">カテゴリ: ${tpl.category}</span>
        </div>
        <button class="delete-btn template-delete-btn" data-index="${originalIndex}">削除</button>
      `;

      section.appendChild(div);
    });

    templateManageList.appendChild(section);
  });

  attachTemplateEvents();
}

function attachTemplateEvents() {
  document.querySelectorAll(".template-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = Number(e.target.dataset.index);
      templates.splice(index, 1);
      saveTemplates();
      renderTemplates();
    });
  });
}

addTemplateButton.addEventListener("click", () => {
  const name = templateNameInput.value.trim();

  if (!name) {
    alert("テンプレ名を入力してください");
    return;
  }

  templates.push({
    name: name,
    category: templateCategoryInput.value
  });

  sortTemplatesByCategory();
  saveTemplates();
  renderTemplates();

  templateNameInput.value = "";
  templateCategoryInput.value = "食品";
});

registerServiceWorker();
sortTemplatesByCategory();
renderTemplates();