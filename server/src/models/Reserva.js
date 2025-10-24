const mongoose = require('mongoose'); 
const reservaSchema = new mongoose.Schema({ 
    cliente: String, estado: String, 
    // pendiente, confirmada, cancelada 
    // fecha: Date, tipoVenta: String 
    // // opcional }); 
    // module.exports = mongoose.model('Reserva', reservaSchema); 
    })