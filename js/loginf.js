const form = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  statusEl.textContent = "Entrando...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      statusEl.textContent = data.error || "Erro no login.";
      return;
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("loggedUser", data.user);
    sessionStorage.setItem("isAdmin", String(!!data.isAdmin));

    window.location.href = "app.html";
  } catch (err) {
    statusEl.textContent = "Erro ao conectar com o servidor.";
  }
});