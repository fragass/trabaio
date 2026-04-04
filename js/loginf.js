const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const statusEl = document.getElementById("status");

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.className = "status";

  if (type === "error") {
    statusEl.classList.add("error");
  }

  if (type === "success") {
    statusEl.classList.add("success");
  }
}

(function redirectIfLogged() {
  const loggedUser = sessionStorage.getItem("loggedUser");
  const token = sessionStorage.getItem("token");

  if (loggedUser && token) {
    window.location.href = "app.html";
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    setStatus("Preencha usuário e senha.", "error");
    return;
  }

  setStatus("Entrando...");

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || "Login inválido.", "error");
      return;
    }

    sessionStorage.setItem("token", data.token || "");
    sessionStorage.setItem("loggedUser", data.user || username);
    sessionStorage.setItem("isAdmin", String(!!data.isAdmin));

    setStatus("Login feito com sucesso.", "success");

    window.location.href = "app.html";
  } catch (error) {
    setStatus("Erro ao conectar com o servidor.", "error");
  }
});
