const boardEl = document.getElementById("board");
const userInfoEl = document.getElementById("userInfo");
const profileMenu = document.getElementById("profileMenu");
const profileTrigger = document.getElementById("profileTrigger");
const logoutBtn = document.getElementById("logoutBtn");

const floatingAddColumnBtn = document.getElementById("floatingAddColumnBtn");

const contextMenu = document.getElementById("contextMenu");
const ctxAddColumnBtn = document.getElementById("ctxAddColumnBtn");
const ctxAddCardBtn = document.getElementById("ctxAddCardBtn");
const ctxAddCheckCardBtn = document.getElementById("ctxAddCheckCardBtn");
const ctxEditBtn = document.getElementById("ctxEditBtn");
const ctxToggleDoneBtn = document.getElementById("ctxToggleDoneBtn");
const ctxDeleteBtn = document.getElementById("ctxDeleteBtn");

const cardModal = document.getElementById("cardModal");
const cardModalTitle = document.getElementById("cardModalTitle");
const cardTitleInput = document.getElementById("cardTitleInput");
const cardDescInput = document.getElementById("cardDescInput");
const cardDoneInput = document.getElementById("cardDoneInput");
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

let contextTarget = { type: "board", columnId: null, cardId: null };

if (!loggedUser) {
  window.location.href = "index.html";
}

userInfoEl.textContent = loggedUser ? `@${loggedUser}` : "@usuario";

profileTrigger.addEventListener("click", (event) => {
  event.stopPropagation();
  profileMenu.classList.toggle("open");
});

document.addEventListener("click", (event) => {
  if (!profileMenu.contains(event.target)) {
    profileMenu.classList.remove("open");
  }

  if (!contextMenu.contains(event.target)) {
    closeContextMenu();
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
  if (text) toast.appendChild(textEl);

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
  if (typeof confirmAction === "function") confirmAction();
  closeConfirm();
});

function findColumn(columnId) {
  return boardData.find((col) => col.id === columnId);
}

function findCard(columnId, cardId) {
  const column = findColumn(columnId);
  if (!column) return null;
  return column.cards.find((card) => card.id === cardId);
}

async function loadBoard() {
  try {
    const res = await fetch(`/api/board?username=${encodeURIComponent(loggedUser)}`);
    const result = await res.json();

    if (!res.ok) {
      showToast("Erro", result.error || "Erro ao carregar board.", "error");
      return;
    }

    boardData = Array.isArray(result.board?.data) ? result.board.data : [];
    normalizeBoardData();
    renderBoard();
  } catch {
    showToast("Erro", "Erro ao carregar o board.", "error");
  }
}

function normalizeBoardData() {
  boardData = boardData.map((column) => ({
    ...column,
    cards: Array.isArray(column.cards)
      ? column.cards.map((card) => ({
          type: card.type === "check" ? "check" : "normal",
          id: card.id || uid("card"),
          title: card.title || "Sem título",
          description: card.description || "",
          done: !!card.done
        }))
      : []
  }));
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
  } catch {
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
    columnEl.dataset.columnId = column.id;

    const header = document.createElement("div");
    header.className = "column-header";

    const title = document.createElement("div");
    title.className = "column-title";
    title.textContent = column.title;

    const actions = document.createElement("div");
    actions.className = "column-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => openColumnEditModal(column.id));

    actions.appendChild(editBtn);

    header.appendChild(title);
    header.appendChild(actions);

    const cardsWrap = document.createElement("div");
    cardsWrap.className = "cards";

    column.cards.forEach((card) => {
      const cardEl = document.createElement("article");
      cardEl.className = "card";
      cardEl.dataset.columnId = column.id;
      cardEl.dataset.cardId = card.id;
      cardEl.addEventListener("click", () => openCardEditor(column.id, card.id));

      if (card.type === "check") {
        const checkWrap = document.createElement("div");
        checkWrap.className = `card-check ${card.done ? "done" : ""}`;

        const checkBox = document.createElement("div");
        checkBox.className = "card-check-box";

        const checkContent = document.createElement("div");
        checkContent.className = "card-check-content";

        const checkTitle = document.createElement("div");
        checkTitle.className = "card-check-title";
        checkTitle.textContent = card.title || "Checklist";

        checkContent.appendChild(checkTitle);

        if (card.description) {
          const checkDesc = document.createElement("div");
          checkDesc.className = "card-check-desc";
          checkDesc.textContent = card.description;
          checkContent.appendChild(checkDesc);
        }

        checkWrap.appendChild(checkBox);
        checkWrap.appendChild(checkContent);
        cardEl.appendChild(checkWrap);
      } else {
        const cardTitle = document.createElement("div");
        cardTitle.className = "card-title";
        cardTitle.textContent = card.title || "Sem título";

        const cardDesc = document.createElement("div");
        cardDesc.className = "card-desc";
        cardDesc.textContent = card.description || "";

        cardEl.appendChild(cardTitle);
        cardEl.appendChild(cardDesc);
      }

      cardsWrap.appendChild(cardEl);
    });

    const addCardBtn = document.createElement("button");
    addCardBtn.className = "add-card-btn";
    addCardBtn.textContent = "+ Novo card";
    addCardBtn.addEventListener("click", () => createCard(column.id, "normal"));

    columnEl.appendChild(header);
    columnEl.appendChild(cardsWrap);
    columnEl.appendChild(addCardBtn);

    boardEl.appendChild(columnEl);
  });
}

function openCardEditor(columnId, cardId) {
  const card = findCard(columnId, cardId);
  if (!card) return;

  activeCardRef = { columnId, cardId };
  cardModalTitle.textContent = card.type === "check" ? "Card checkbox" : "Card";
  cardTitleInput.value = card.title || "";
  cardDescInput.value = card.description || "";
  cardDoneInput.checked = !!card.done;
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
  card.done = !!cardDoneInput.checked;

  renderBoard();
  closeCardEditor();
  scheduleSave(true);
}

function createCard(columnId, type = "normal") {
  const column = findColumn(columnId);
  if (!column) return;

  const newCard = {
    id: uid("card"),
    type,
    title: type === "check" ? "Nova tarefa" : "Novo card",
    description: "",
    done: false
  };

  column.cards.push(newCard);
  renderBoard();
  scheduleSave();
  openCardEditor(columnId, newCard.id);
}

function deleteCardByRef(columnId, cardId) {
  const column = findColumn(columnId);
  if (!column) return;

  column.cards = column.cards.filter((card) => card.id !== cardId);
  renderBoard();
  scheduleSave(true);
  showToast("Card removido", "O card foi excluído.", "success");
}

function requestDeleteCard() {
  if (!activeCardRef) return;

  const { columnId, cardId } = activeCardRef;

  openConfirm(
    "Excluir card",
    "Tem certeza que deseja excluir este card?",
    () => {
      closeCardEditor();
      deleteCardByRef(columnId, cardId);
    }
  );
}

function toggleCardDone(columnId, cardId) {
  const card = findCard(columnId, cardId);
  if (!card) return;

  card.done = !card.done;
  renderBoard();
  scheduleSave(true);
  showToast(
    card.done ? "Concluído" : "Reaberto",
    card.done ? "Tarefa marcada como concluída." : "Tarefa desmarcada.",
    "success"
  );
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

function deleteColumnById(columnId) {
  boardData = boardData.filter((col) => col.id !== columnId);
  renderBoard();
  scheduleSave(true);
  showToast("Coluna removida", "A coluna foi excluída.", "success");
}

function requestDeleteColumn() {
  if (!activeColumnRef) return;

  const column = findColumn(activeColumnRef);
  if (!column) return;

  const targetColumnId = activeColumnRef;

  openConfirm(
    "Excluir coluna",
    `Tem certeza que deseja excluir a coluna "${column.title}"?`,
    () => {
      closeColumnEditor();
      deleteColumnById(targetColumnId);
    }
  );
}

function openContextMenu(x, y, target) {
  contextTarget = target;

  ctxAddColumnBtn.classList.add("hidden");
  ctxAddCardBtn.classList.add("hidden");
  ctxAddCheckCardBtn.classList.add("hidden");
  ctxEditBtn.classList.add("hidden");
  ctxToggleDoneBtn.classList.add("hidden");
  ctxDeleteBtn.classList.add("hidden");

  if (target.type === "board") {
    ctxAddColumnBtn.classList.remove("hidden");
  }

  if (target.type === "column") {
    ctxAddCardBtn.classList.remove("hidden");
    ctxAddCheckCardBtn.classList.remove("hidden");
    ctxEditBtn.classList.remove("hidden");
    ctxDeleteBtn.classList.remove("hidden");
  }

  if (target.type === "card") {
    ctxEditBtn.classList.remove("hidden");
    ctxDeleteBtn.classList.remove("hidden");

    const card = findCard(target.columnId, target.cardId);
    if (card && card.type === "check") {
      ctxToggleDoneBtn.textContent = card.done ? "Desmarcar conclusão" : "Marcar como concluído";
      ctxToggleDoneBtn.classList.remove("hidden");
    }
  }

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.classList.remove("hidden");
}

function closeContextMenu() {
  contextMenu.classList.add("hidden");
}

boardEl.addEventListener("contextmenu", (event) => {
  event.preventDefault();

  const cardEl = event.target.closest("[data-card-id]");
  const columnEl = event.target.closest("[data-column-id]");

  if (cardEl) {
    openContextMenu(event.clientX, event.clientY, {
      type: "card",
      columnId: cardEl.dataset.columnId,
      cardId: cardEl.dataset.cardId
    });
    return;
  }

  if (columnEl) {
    openContextMenu(event.clientX, event.clientY, {
      type: "column",
      columnId: columnEl.dataset.columnId,
      cardId: null
    });
    return;
  }

  openContextMenu(event.clientX, event.clientY, {
    type: "board",
    columnId: null,
    cardId: null
  });
});

ctxAddColumnBtn.addEventListener("click", () => {
  closeContextMenu();
  openColumnCreateModal();
});

ctxAddCardBtn.addEventListener("click", () => {
  if (!contextTarget.columnId) return;
  closeContextMenu();
  createCard(contextTarget.columnId, "normal");
});

ctxAddCheckCardBtn.addEventListener("click", () => {
  if (!contextTarget.columnId) return;
  closeContextMenu();
  createCard(contextTarget.columnId, "check");
});

ctxEditBtn.addEventListener("click", () => {
  closeContextMenu();

  if (contextTarget.type === "column") {
    openColumnEditModal(contextTarget.columnId);
    return;
  }

  if (contextTarget.type === "card") {
    openCardEditor(contextTarget.columnId, contextTarget.cardId);
  }
});

ctxToggleDoneBtn.addEventListener("click", () => {
  closeContextMenu();
  if (contextTarget.type === "card") {
    toggleCardDone(contextTarget.columnId, contextTarget.cardId);
  }
});

ctxDeleteBtn.addEventListener("click", () => {
  closeContextMenu();

  if (contextTarget.type === "column") {
    const column = findColumn(contextTarget.columnId);
    if (!column) return;

    openConfirm(
      "Excluir coluna",
      `Tem certeza que deseja excluir a coluna "${column.title}"?`,
      () => deleteColumnById(contextTarget.columnId)
    );
    return;
  }

  if (contextTarget.type === "card") {
    openConfirm(
      "Excluir card",
      "Tem certeza que deseja excluir este card?",
      () => deleteCardByRef(contextTarget.columnId, contextTarget.cardId)
    );
  }
});

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
  if (event.target === cardModal) closeCardEditor();
});

columnModal.addEventListener("click", (event) => {
  if (event.target === columnModal) closeColumnEditor();
});

confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) closeConfirm();
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
