const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const mongoose = require("mongoose");
const Movie = require("../src/models/Movie");
const Showtime = require("../src/models/Showtime");

(async () => {
  try {
    console.log("🔗 Conectando a MongoDB...");
    console.log("🧩 URI:", process.env.MONGODB_URI); // 👀 Línea para verificar

    if (!process.env.MONGODB_URI) {
      throw new Error("No se encontró MONGODB_URI en el archivo .env");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado correctamente a la base de datos");

    const showtimes = await Showtime.find();
    console.log(`📅 Encontradas ${showtimes.length} funciones`);

    let updates = 0;

    for (const showtime of showtimes) {
      if (!showtime.movie) continue;

      const movie = await Movie.findById(showtime.movie);
      if (!movie) {
        console.log(`⚠️ No se encontró película con ID ${showtime.movie}`);
        continue;
      }

      if (!movie.showtimes.includes(showtime._id)) {
        movie.showtimes.push(showtime._id);
        await movie.save();
        updates++;
        console.log(`✅ Vinculado Showtime ${showtime._id} → ${movie.title}`);
      }
    }

    console.log(`\n🎉 Vinculación completa. ${updates} funciones asociadas.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error durante la vinculación:", err);
    process.exit(1);
  }
})();
