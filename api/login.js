import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function makeToken(username) {
  return Buffer.from(`${username}:${Date.now()}`).toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;

    const username = String(body?.username || "").trim();
    const password = String(body?.password || "").trim();

    if (!username || !password) {
      return res.status(400).json({
        error: "Username e password são obrigatórios."
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("username, password, is_admin")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.password !== password) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    return res.status(200).json({
      success: true,
      token: makeToken(data.username),
      user: data.username,
      isAdmin: !!data.is_admin
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Erro interno no servidor"
    });
  }
}