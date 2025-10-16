
# Implementación: Compra de asientos con autenticación (Express + MongoDB Atlas)

- **Protegí las rutas de compras** (`POST /api/purchases/` y `GET /api/purchases/user/:userId`) con `authMiddleware` (JWT en `Authorization: Bearer <token>`).
- **Agregué endpoint** `GET /api/purchases/me` para obtener las compras del usuario autenticado.
- **purchaseController.create** ahora toma `userId` de `req.userId` (proveniente del token) para evitar suplantación.
- **Monté rutas en `server/index.js`**: `/api/auth`, `/api/movies`, `/api/showtimes`, `/api/purchases`. También añadí `app.use(cors())` y `app.use(express.json())` si faltaban.
- El modelo `Showtime` usa `seatsBooked: [String]` y la creación de compras hace un **update atómico** para bloquear asientos libres.

## Uso desde frontend
```http
POST /api/purchases/
Authorization: Bearer <token>
Content-Type: application/json

{
  "showtimeId": "<id-de-función>",
  "seats": ["A1","A2"]
}
```
Respuestas: `200 OK` compra exitosa; `409/400` si ya están ocupados; `401` si token inválido o ausente.

Para listar compras del usuario autenticado:
```
GET /api/purchases/me
Authorization: Bearer <token>
```
