import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";

const pool = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senai",
  database: "devhub",
});

const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API DevHub rodando!");
});


app.get("/usuarios", async (req, res) => {
  const [results] = await pool.query("SELECT * FROM usuario");
  res.json(results);
});

app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const [results] = await pool.query(
    "SELECT * FROM usuario WHERE idusuario = ?",
    [id]
  );
  res.json(results[0]);
});

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, idade } = req.body;
    const [results] = await pool.query(
      "INSERT INTO usuario (nome, idade) VALUES (?, ?)",
      [nome, idade]
    );
    const [usuarioCriado] = await pool.query(
      "SELECT * FROM usuario WHERE idusuario = ?",
      [results.insertId]
    );
    res.status(201).json(usuarioCriado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar usuário" });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM usuario WHERE idusuario = ?", [id]);
    res.status(200).json({ message: "Usuário deletado!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, idade } = req.body;
    await pool.query(
      "UPDATE usuario SET nome = ?, idade = ? WHERE idusuario = ?",
      [nome, idade, id]
    );
    res.status(200).json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar usuário" });
  }
});



app.post("/registrar", async (req, res) => {
  try {
    const { nome, idade, email, senha } = req.body;
    const [results] = await pool.query(
      "INSERT INTO usuario (nome, idade, email, senha) VALUES (?, ?, ?, ?)",
      [nome, idade, email, senha]
    );
    const [usuarioCriado] = await pool.query(
      "SELECT * FROM usuario WHERE idusuario = ?",
      [results.insertId]
    );
    res.status(201).json(usuarioCriado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao registrar usuário" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [usuario] = await pool.query(
      "SELECT * FROM usuario WHERE email = ? AND senha = ?",
      [email, senha]
    );
    if (usuario.length > 0) {
      res.status(200).json({ message: "Usuário logado", dados: usuario[0] });
    } else {
      res.status(404).json({ message: "Email ou senha incorretos!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro no login" });
  }
});



app.get("/logs", async (req, res) => {
  try {
    const pagina = Number(req.query.pagina) || 1;
    const quantidade = Number(req.query.quantidade) || 20;
    const offset = (pagina - 1) * quantidade;

    const [results] = await pool.query(
      `
      SELECT 
        lgs.id,
        lgs.categoria,
        lgs.descricao,
        lgs.horas_trabalhadas,
        lgs.linhas_codigo,
        lgs.bugs_corrigidos,
        (SELECT COUNT(*) FROM likes WHERE likes.log_id = lgs.id) AS likes
      FROM lgs
      ORDER BY lgs.id DESC
      LIMIT ? OFFSET ?;
      `,
      [quantidade, offset]
    );

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao buscar logs" });
  }
});


app.post("/logs", async (req, res) => {
  try {
    const { categoria, descricao, horas_trabalhadas, linhas_codigo, bugs_corrigidos, user_id } = req.body;

    const [results] = await pool.query(
      "INSERT INTO lgs (categoria, descricao, horas_trabalhadas, linhas_codigo, bugs_corrigidos, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [categoria, descricao, horas_trabalhadas, linhas_codigo, bugs_corrigidos, user_id]
    );

    const [logCriado] = await pool.query("SELECT * FROM lgs WHERE id = ?", [results.insertId]);
    res.status(201).json(logCriado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar log" });
  }
});



app.get("/likes", async (req, res) => {
  try {
    const [results] = await pool.query("SELECT * FROM likes");
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar likes" });
  }
});

app.post("/likes", async (req, res) => {
  try {
    const { log_id, user_id } = req.body;
    const [results] = await pool.query(
      "INSERT INTO likes (log_id, user_id) VALUES (?, ?)",
      [log_id, user_id]
    );
    const [likeCriado] = await pool.query("SELECT * FROM likes WHERE id = ?", [results.insertId]);
    res.status(201).json(likeCriado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao curtir" });
  }
});

app.delete("/like", async (req, res) => {
  try {
    const { user_id, log_id } = req.query;
    await pool.query("DELETE FROM likes WHERE user_id = ? AND log_id = ?", [user_id, log_id]);
    res.status(200).json({ message: "Like removido" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao remover like" });
  }
});


app.get("/usuarios/:id/horas", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      "SELECT SUM(horas_trabalhadas) AS total_horas FROM lgs WHERE user_id = ?",
      [id]
    );
    res.json({ user_id: id, total_horas: results[0].total_horas || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao obter horas" });
  }
});

app.get("/usuarios/:id/logs", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      "SELECT COUNT(*) AS total_logs FROM lgs WHERE user_id = ?",
      [id]
    );
    res.json({ user_id: id, total_logs: results[0].total_logs || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao contar logs" });
  }
});

app.get("/usuarios/:id/bugs", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      "SELECT SUM(bugs_corrigidos) AS total_bugs FROM lgs WHERE user_id = ?",
      [id]
    );
    res.json({ user_id: id, total_bugs: results[0].total_bugs || 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao contar bugs" });
  }
});



app.listen(3000, () => {
  console.log(" Servidor rodando na porta 3000");
});
