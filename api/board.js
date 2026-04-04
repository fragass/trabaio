import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const defaultBoard = [
  { id: "col-todo", title: "A Fazer", cards: [] },
  { id: "col-doing", title: "Fazendo", cards: [] },
  { id: "col-done", title: "Feito", cards: [] }
];

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const username = String(req.query.username || "").trim();

      if (!username) {
        return res.status(400).json({ error: "Username obrigatório." });
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (userError) {
        return res.status(500).json({ error: userError.message });
      }

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const { data: board, error: boardError } = await supabase
        .from("boards")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (boardError) {
        return res.status(500).json({ error: boardError.message });
      }

      if (!board) {
        const { data: inserted, error: insertError } = await supabase
          .from("boards")
          .insert({
            username,
            title: "Meu Board",
            data: defaultBoard
          })
          .select()
          .single();

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }

        return res.status(200).json({
          success: true,
          board: inserted
        });
      }

      return res.status(200).json({
        success: true,
        board
      });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      const username = String(body?.username || "").trim();
      const data = body?.data;

      if (!username) {
        return res.status(400).json({ error: "Username obrigatório." });
      }

      if (!Array.isArray(data)) {
        return res.status(400).json({ error: "Data inválida." });
      }

      const { data: existing, error: existingError } = await supabase
        .from("boards")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existingError) {
        return res.status(500).json({ error: existingError.message });
      }

      if (!existing) {
        const { error: insertError } = await supabase
          .from("boards")
          .insert({
            username,
            title: "Meu Board",
            data
          });

        if (insertError) {
          return res.status(500).json({ error: insertError.message });
        }

        return res.status(200).json({ success: true });
      }

      const { error: updateError } = await supabase
        .from("boards")
        .update({
          data,
          updated_at: new Date().toISOString()
        })
        .eq("username", username);

      if (updateError) {
        return res.status(500).json({ error: updateError.message });
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    return res.status(500).json({
      error: err.message || "Erro interno no servidor."
    });
  }
}