import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas.");
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function makeToken(username) {
  return Buffer.from(`${username}:${Date.now()}`).toString("base64");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {});

    const username = String(body.username || "").trim();
    const password = String(body.password || "").trim();

    if (!username || !password) {
      return res.status(400).json({
        error: "Usuário e senha são obrigatórios."
      });
    }

    const { data, error } = await supabase
      .from("users")
      .select("username, password, is_admin")
      .eq("username", username)
      .maybeSingle();

    if (error) {
      console.error("Supabase select error:", error);
      return res.status(500).json({
        error: `Erro ao consultar users: ${error.message}`
      });
    }

    if (!data) {
      return res.status(401).json({
        error: "Usuário não encontrado."
      });
    }

    if (data.password !== password) {
      return res.status(401).json({
        error: "Senha inválida."
      });
    }

    return res.status(200).json({
      success: true,
      token: makeToken(data.username),
      user: data.username,
      isAdmin: !!data.is_admin
    });
  } catch (err) {
    console.error("Login API fatal error:", err);
    return res.status(500).json({
      error: err.message || "Erro interno no servidor."
    });
  }
}
