// server/src/scripts/fixMoviesImages.js
// 🔧 Corrige películas que usan "images" (array) → "image" (string)
// Ejecución:  node server/src/scripts/fixMoviesImages.js

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"), // ✅ sube 1 nivel, no 2
});


(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Conectado a MongoDB");

    const Movie = mongoose.model(
      "Movie",
      new mongoose.Schema({}, { strict: false }),
      "movies"
    );

    const movies = await Movie.find();
    console.log(`📽️ Encontradas ${movies.length} películas. Procesando...\n`);

    let updatedCount = 0;

    for (const movie of movies) {
      if (movie.images && Array.isArray(movie.images) && movie.images.length > 0) {
        const firstImage = movie.images[0];
        movie.image = firstImage; // crea el nuevo campo
        delete movie.images; // elimina el viejo array

        await movie.save();
        console.log(`✅ Actualizada: "${movie.title}" → image = "${firstImage}"`);
        updatedCount++;
      } else if (movie.image) {
        console.log(`✔️ Sin cambios: "${movie.title}" (ya tiene campo image)`);
      } else {
        console.log(`⚠️ Película sin imagen: "${movie.title}"`);
      }
    }

    console.log(`\n🎉 Migración completada. ${updatedCount} documentos actualizados.`);
  } catch (err) {
    console.error("❌ Error durante la migración:", err);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Conexión cerrada.");
  }
})();
