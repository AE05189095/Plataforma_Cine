const express = require("express");
const app = express();
const PORT = 5000;


app.use(express.json());

app.get("/", (req, res) => {
  res.send("Servidor corriendo");
});


const authRoutes = require("./src/routes/auth.routes");
app.use("/api", authRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});



