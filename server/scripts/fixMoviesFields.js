// server/scripts/fixMoviesFields.js
// 🧩 Corrige el formato de las películas en MongoDB:
// Convierte "images" → "image" (string) y "genres" → "genre" (string)

const mongoose = require("mongoose");
const path = require("path");

// ⚙️ Cargar .env
require("dotenv").config({
  // Si tu archivo .env está en la raíz del proyecto, cambia a "../../.env"
  path: path.resolve(__dirname, "../.env"),
});

(async () => {
  try {
    // 🔌 Conexión a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    // Modelo temporal flexible
    const Movie = mongoose.model(
      "Movie",
      new mongoose.Schema({}, { strict: false }),
      "movies"
    );

    const movies = await Movie.find();
    console.log(`🎬 ${movies.length} películas encontradas.\n`);

    let updatedCount = 0;

    for (const movie of movies) {
      let changed = false;

      // 🖼️ Corregir imagen
      if (
        movie.images &&
        Array.isArray(movie.images) &&
        movie.images.length > 0
      ) {
        const firstImage = movie.images[0].replace(/^\/?images\//, ""); // eliminar prefijo /images/
        movie.image = firstImage;
        delete movie.images;
        changed = true;
        console.log(`🖼️ Imagen actualizada: ${movie.title} → ${firstImage}`);
      } else if (!movie.image || movie.image.trim() === "") {
        movie.image = "";
        changed = true;
        console.log(`⚠️ ${movie.title} no tenía imagen, se asignó valor vacío`);
      }

      // 🎭 Corregir género
      if (
        movie.genres &&
        Array.isArray(movie.genres) &&
        movie.genres.length > 0
      ) {
        const firstGenre = movie.genres[0];
        movie.genre = firstGenre;
        delete movie.genres;
        changed = true;
        console.log(`🎭 Género actualizado: ${movie.title} → ${firstGenre}`);
      } else if (!movie.genre) {
        movie.genre = "";
        changed = true;
        console.log(`⚠️ ${movie.title} no tenía género`);
      }

      if (changed) {
        await movie.save();
        updatedCount++;
      }
    }

    console.log(`\n✅ Migración completada: ${updatedCount} películas actualizadas.`);
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada.");
  }
})();
