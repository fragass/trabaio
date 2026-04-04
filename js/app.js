const boardEl = document.getElementById("board");
const userInfoEl = document.getElementById("userInfo");
const profileDropdownUser = document.getElementById("profileDropdownUser");
const profileAvatar = document.getElementById("profileAvatar");
const profileMenu = document.getElementById("profileMenu");
const profileTrigger = document.getElementById("profileTrigger");
const logoutBtn = document.getElementById("logoutBtn");

const floatingAddColumnBtn = document.getElementById("floatingAddColumnBtn");

const cardModal = document.getElementById("cardModal");
const cardTitleInput = document.getElementById("cardTitleInput");
const cardDescInput = document.getElementById("cardDescInput");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveCardBtn = document.getElementById("saveCardBtn");
const deleteCardBtn = document.getElementById("deleteCardBtn");

const columnModal = document.getElementById("columnModal");
const columnModalTitle = document.getElementById("columnModalTitle");
const columnNameInput = document.getElementById("columnNameInput");
const closeColumnModalBtn = document.getElementById("closeColumnModalBtn");
const saveColumnBtn = document.getElementById("saveColumnBtn");
const deleteColumnBtn = document.getElementById("deleteColumnBtn");

const confirmModal = document.getElementById("confirmModal");
const confirmTitle = document.getElementById("confirmTitle");
const confirmMessage = document.getElementById("confirmMessage");
const closeConfirmModalBtn = document.getElementById("closeConfirmModalBtn");
const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
const acceptConfirmBtn = document.getElementById("acceptConfirmBtn");

const toastContainer = document.getElementById("toastContainer");

let loggedUser = sessionStorage.getItem("loggedUser");
let boardData = [];
let activeCardRef = null;
let activeColumnRef = null;
let confirmAction = null;
let saveTimeout = null;
let isSaving = false;

if (!loggedUser) {
  window.location.href = "index.html";
}

const usernameLabel = loggedUser ? `@${loggedUser}` : "@usuario";
userInfoEl.textContent = usernameLabel;
profileDropdownUser.textContent = usernameLabel;
profileAvatar.textContent = (loggedUser || "u").charAt(0).toUpperCase();

profileTrigger.addEventListener("click", () => {
  profileMenu.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (!profileMenu.contains(event.target)) {
    profileMenu.classList.remove("open");
  }
});

function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}

function showToast(title, text = "", type = "") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`.trim();

  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;

  const textEl = document.createElement("div");
  textEl.className = "toast-text";
  textEl.textContent = text;

  toast.appendChild(titleEl);
  if (text) {
    toast.appendChild(textEl);
  }

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2600);
}

function openModal(modal) {
  modal.classList.remove("hidden");
}

function closeModal(modal) {
  modal.classList.add("hidden");
}

function openConfirm(title, message, onAccept) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmAction = onAccept;
  openModal(confirmModal);
}

function closeConfirm() {
  confirmAction = null;
  closeModal(confirmModal);
}

closeConfirmModalBtn.addEventListener("click", closeConfirm);
cancelConfirmBtn.addEventListener("click", closeConfirm);
acceptConfirmBtn.addEventListener("click", () => {
  if (typeof confirmAction === "function") {
    confirmAction();
  }
  closeConfirm();
});

async function loadBoard() {
  try {
    const res = await fetch(`/api/board?username=${encodeURIComponent(loggedUser)}`);
    const result = await res.json();

    if (!res.ok) {
      showToast("Erro", result.error || "Erro ao carregar board.", "error");
      return;
    }

    boardData = Array.isArray(result.board?.data) ? result.board.data : [];
    renderBoard();
  } catch (err) {
    showToast("Erro", "Erro ao carregar o board.", "error");
  }
}

async function saveBoard(showFeedback = false) {
  if (isSaving) return;

  try {
    isSaving = true;

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
      showToast("Erro", result.error || "Erro ao salvar board.", "error");
      return;
    }

    if (showFeedback) {
      showToast("Salvo", "Tudo salvo automaticamente.", "success");
    }
  } catch (err) {
    showToast("Erro", "Erro ao salvar board.", "error");
  } finally {
    isSaving = false;
  }
}

function scheduleSave(showFeedback = false) {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveBoard(showFeedback);
  }, 450);
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
    renameBtn.textContent = "Editar";
    renameBtn.addEventListener("click", () => openColumnEditModal(column.id));

    actions.appendChild(renameBtn);

    header.appendChild(title);
    header.appendChild(actions);

    const cardsWrap = document.createElement("div");
    cardsWrap.className = "cards";

    column.cards.forEach((card) => {
      const cardEl = document.createElement("article");
      cardEl.className = "card";
      cardEl.addEventListener("click", () => openCardEditor(column.id, card.id));

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
  scheduleSave();
  openCardEditor(columnId, newCard.id);
}

function openCardEditor(columnId, cardId) {
  const card = findCard(columnId, cardId);
  if (!card) return;

  activeCardRef = { columnId, cardId };
  cardTitleInput.value = card.title || "";
  cardDescInput.value = card.description || "";
  openModal(cardModal);
}

function closeCardEditor() {
  activeCardRef = null;
  closeModal(cardModal);
}

function saveCardChanges() {
  if (!activeCardRef) return;

  const card = findCard(activeCardRef.columnId, activeCardRef.cardId);
  if (!card) return;

  card.title = cardTitleInput.value.trim() || "Sem título";
  card.description = cardDescInput.value.trim();

  renderBoard();
  closeCardEditor();
  scheduleSave(true);
}

function deleteCard() {
  if (!activeCardRef) return;

  const column = findColumn(activeCardRef.columnId);
  if (!column) return;

  column.cards = column.cards.filter((card) => card.id !== activeCardRef.cardId);
  renderBoard();
  closeCardEditor();
  scheduleSave(true);
  showToast("Card removido", "O card foi excluído.", "success");
}

function openColumnCreateModal() {
  activeColumnRef = null;
  columnModalTitle.textContent = "Nova coluna";
  columnNameInput.value = "";
  deleteColumnBtn.classList.add("hidden");
  openModal(columnModal);
}

function openColumnEditModal(columnId) {
  const column = findColumn(columnId);
  if (!column) return;

  activeColumnRef = columnId;
  columnModalTitle.textContent = "Editar coluna";
  columnNameInput.value = column.title || "";
  deleteColumnBtn.classList.remove("hidden");
  openModal(columnModal);
}

function closeColumnEditor() {
  activeColumnRef = null;
  columnNameInput.value = "";
  closeModal(columnModal);
}

function saveColumnChanges() {
  const name = columnNameInput.value.trim();

  if (!name) {
    showToast("Campo vazio", "Digite um nome para a coluna.", "error");
    return;
  }

  if (!activeColumnRef) {
    boardData.push({
      id: uid("col"),
      title: name,
      cards: []
    });

    renderBoard();
    closeColumnEditor();
    scheduleSave(true);
    showToast("Coluna criada", "A nova coluna já foi adicionada.", "success");
    return;
  }

  const column = findColumn(activeColumnRef);
  if (!column) return;

  column.title = name;
  renderBoard();
  closeColumnEditor();
  scheduleSave(true);
  showToast("Coluna atualizada", "O nome da coluna foi salvo.", "success");
}

function requestDeleteColumn() {
  if (!activeColumnRef) return;

  const column = findColumn(activeColumnRef);
  if (!column) return;

  openConfirm(
    "Excluir coluna",
    `Tem certeza que deseja excluir a coluna "${column.title}"?`,
    () => {
      boardData = boardData.filter((col) => col.id !== activeColumnRef);
      renderBoard();
      closeColumnEditor();
      scheduleSave(true);
      showToast("Coluna removida", "A coluna foi excluída.", "success");
    }
  );
}

function requestDeleteCard() {
  if (!activeCardRef) return;

  openConfirm(
    "Excluir card",
    "Tem certeza que deseja excluir este card?",
    deleteCard
  );
}

closeModalBtn.addEventListener("click", closeCardEditor);
saveCardBtn.addEventListener("click", saveCardChanges);
deleteCardBtn.addEventListener("click", requestDeleteCard);

closeColumnModalBtn.addEventListener("click", closeColumnEditor);
saveColumnBtn.addEventListener("click", saveColumnChanges);
deleteColumnBtn.addEventListener("click", requestDeleteColumn);

floatingAddColumnBtn.addEventListener("click", openColumnCreateModal);

logoutBtn.addEventListener("click", () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("loggedUser");
  sessionStorage.removeItem("isAdmin");
  window.location.href = "index.html";
});

cardModal.addEventListener("click", (event) => {
  if (event.target === cardModal) {
    closeCardEditor();
  }
});

columnModal.addEventListener("click", (event) => {
  if (event.target === columnModal) {
    closeColumnEditor();
  }
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirm();
  }
});

window.addEventListener("beforeunload", () => {
  if (!loggedUser) return;

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
