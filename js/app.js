const boardEl = document.getElementById("board");
const userInfoEl = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");
const saveBoardBtn = document.getElementById("saveBoardBtn");

const contextMenu = document.getElementById("contextMenu");
const newColumnBtn = document.getElementById("newColumnBtn");

const cardModal = document.getElementById("cardModal");
const cardTitleInput = document.getElementById("cardTitleInput");
const cardDescInput = document.getElementById("cardDescInput");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveCardBtn = document.getElementById("saveCardBtn");
const deleteCardBtn = document.getElementById("deleteCardBtn");

let loggedUser = sessionStorage.getItem("loggedUser");
let boardData = [];
let activeCardRef = null;

if (!loggedUser) {
  window.location.href = "index.html";
}

userInfoEl.textContent = loggedUser ? `@${loggedUser}` : "";

function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function loadBoard() {
  try {
    const res = await fetch(`/api/board?username=${encodeURIComponent(loggedUser)}`);
    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Erro ao carregar board.");
      return;
    }

    boardData = Array.isArray(result.board?.data) ? result.board.data : [];
    renderBoard();
  } catch (err) {
    alert("Erro ao carregar o board.");
  }
}

async function saveBoard() {
  try {
    const res = await fetch("/api/board", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: loggedUser,
        data: boardData
      })
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Erro ao salvar board.");
    }
  } catch (err) {
    alert("Erro ao salvar board.");
  }
}

function renderBoard() {
  boardEl.innerHTML = "";

  boardData.forEach((column) => {
    const columnEl = document.createElement("section");
    columnEl.className = "column";

    const header = document.createElement("div");
    header.className = "column-header";

    const title = document.createElement("div");
    title.className = "column-title";
    title.textContent = column.title;

    const actions = document.createElement("div");
    actions.className = "column-actions";

    const renameBtn = document.createElement("button");
    renameBtn.textContent = "Renomear";
    renameBtn.addEventListener("click", () => renameColumn(column.id));

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Excluir";
    removeBtn.addEventListener("click", () => deleteColumn(column.id));

    actions.appendChild(renameBtn);
    actions.appendChild(removeBtn);

    header.appendChild(title);
    header.appendChild(actions);

    const cardsWrap = document.createElement("div");
    cardsWrap.className = "cards";

    column.cards.forEach((card) => {
      const cardEl = document.createElement("article");
      cardEl.className = "card";
      cardEl.addEventListener("click", () => openCardModal(column.id, card.id));

      const cardTitle = document.createElement("div");
      cardTitle.className = "card-title";
      cardTitle.textContent = card.title || "Sem título";

      const cardDesc = document.createElement("div");
      cardDesc.className = "card-desc";
      cardDesc.textContent = card.description || "";

      cardEl.appendChild(cardTitle);
      cardEl.appendChild(cardDesc);
      cardsWrap.appendChild(cardEl);
    });

    const addCardBtn = document.createElement("button");
    addCardBtn.className = "add-card-btn";
    addCardBtn.textContent = "+ Novo card";
    addCardBtn.addEventListener("click", () => createCard(column.id));

    columnEl.appendChild(header);
    columnEl.appendChild(cardsWrap);
    columnEl.appendChild(addCardBtn);

    boardEl.appendChild(columnEl);
  });
}

function findColumn(columnId) {
  return boardData.find((col) => col.id === columnId);
}

function findCard(columnId, cardId) {
  const column = findColumn(columnId);
  if (!column) return null;
  return column.cards.find((card) => card.id === cardId);
}

function createCard(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  const newCard = {
    id: uid("card"),
    title: "Novo card",
    description: ""
  };

  column.cards.push(newCard);
  renderBoard();
  openCardModal(columnId, newCard.id);
}

function renameColumn(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  const nextTitle = prompt("Novo nome da coluna:", column.title);
  if (!nextTitle || !nextTitle.trim()) return;

  column.title = nextTitle.trim();
  renderBoard();
}

function deleteColumn(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  const confirmed = confirm(`Excluir coluna "${column.title}"?`);
  if (!confirmed) return;

  boardData = boardData.filter((col) => col.id !== columnId);
  renderBoard();
}

function openCardModal(columnId, cardId) {
  const card = findCard(columnId, cardId);
  if (!card) return;

  activeCardRef = { columnId, cardId };
  cardTitleInput.value = card.title || "";
  cardDescInput.value = card.description || "";
  cardModal.classList.remove("hidden");
}

function closeCardModal() {
  activeCardRef = null;
  cardModal.classList.add("hidden");
}

function saveCardChanges() {
  if (!activeCardRef) return;

  const card = findCard(activeCardRef.columnId, activeCardRef.cardId);
  if (!card) return;

  card.title = cardTitleInput.value.trim() || "Sem título";
  card.description = cardDescInput.value.trim();

  renderBoard();
  closeCardModal();
}

function deleteCard() {
  if (!activeCardRef) return;

  const column = findColumn(activeCardRef.columnId);
  if (!column) return;

  column.cards = column.cards.filter((card) => card.id !== activeCardRef.cardId);
  renderBoard();
  closeCardModal();
}

function openContextMenu(x, y) {
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
}

function closeContextMenu() {
  contextMenu.classList.add("hidden");
}

function createColumn() {
  const name = prompt("Nome da nova coluna:");
  if (!name || !name.trim()) return;

  boardData.push({
    id: uid("col"),
    title: name.trim(),
    cards: []
  });

  renderBoard();
}

document.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  openContextMenu(e.pageX, e.pageY);
});

document.addEventListener("click", (e) => {
  if (!contextMenu.contains(e.target)) {
    closeContextMenu();
  }
});

newColumnBtn.addEventListener("click", () => {
  createColumn();
  closeContextMenu();
});

closeModalBtn.addEventListener("click", closeCardModal);
saveCardBtn.addEventListener("click", saveCardChanges);
deleteCardBtn.addEventListener("click", deleteCard);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("loggedUser");
  sessionStorage.removeItem("isAdmin");
  window.location.href = "index.html";
});

saveBoardBtn.addEventListener("click", saveBoard);

window.addEventListener("beforeunload", () => {
  navigator.sendBeacon?.(
    "/api/board",
    new Blob(
      [
        JSON.stringify({
          username: loggedUser,
          data: boardData
        })
      ],
      { type: "application/json" }
    )
  );
});

loadBoard();