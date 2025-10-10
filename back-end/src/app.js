import express from "express";
import mysql from "mysql2/promise";
const pool = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "senai",
  database: "senai",
});
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Olá Mundo");
});

app.get("/usuarios", async (req, res) => {
  const [results] = await pool.query("SELECT * FROM usuario");
  res.send(results);
});

app.get("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const [results] = await pool.query("SELECT * FROM usuario WHERE idusuario=?", id);
  res.send(results);
});
//LOGIN
app.post("/login", async (req, res) => {
  try {
    const { body } = req;
    

    const [usuarioLogado] = await pool.query(
      "SELECT * FROM usuario WHERE email=? and senha=?",
      [body.email, body.senha]
    );

    if (usuarioLogado.length > 0) {
       return res.status(200).json(usuarioLogado);
    }
        return res.status(404).json("deu erro");
   
  } catch (error) {
    console.log(error);
  }
});
//LOG
app.post("/log", async (req, res) => {
  try {
    const {body} = req;
    const [results] = await pool.query(
      "INSERT INTO log (categoria, horas_trabalhadas, linha_de_codigo, bugs_corrigidos) VALUES (?, ?, ?, ?)",
      [body.categoria, body.horas_trabalhadas, body.linha_de_codigo, body.bugs_corrigidos]
    );
    const [logRegistrado] = await pool.query(
      "SELECT * FROM log WHERE id_log",
      results.insertId
    );
    return res.status(201).json(logRegistrado);
  } catch (error) {
   console.log(error)
  }
})
// REGISTRAR
app.post("/registrar", async (req, res) => {
  try {
    const { body } = req;
    const [results] = await pool.query(
      "INSERT INTO usuario (nome,idade, email, senha) VALUES (?,?, ?,?)",
      [body.nome, body.idade, body.email, body.senha]
    );

    const [usuarioRegistrado] = await pool.query(
      "Select * from usuario WHERE id_usuario=?",
      results.insertId
    );

    return res.status(201).json(usuarioRegistrado);
  } catch (error) {
    console.log(error);
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [results] = await pool.query(
      "DELETE FROM usuario WHERE idusuario=?",
      id
    );
    res.status(200).send("Usuário deletado!", results)
  } catch (error) {
    console.log(error)
  }
});

app.put("/usuarios/:id", async(req,res)=>{
  try {
    const { id } = req.params;
    const { body } = req
    const [results] = await pool.query(
     "UPDATE usuario SET `nome` = ?, `idade` = ? WHERE idusuario = ?; ",
      [body.nome, body.idade, id]
    )
    res.status(200).send("Usuario atualizado", results)
  } catch (error) { 
    console.log(error)
  }
})

app.listen(3000, () => {
  console.log(`Servidor rodando na porta: 3000`);
});
