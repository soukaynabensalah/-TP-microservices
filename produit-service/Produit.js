const mongoose = require("mongoose");

const ProduitSchema = mongoose.Schema({
    nom: String,
    description: String,
    prix: Number,
    stock: Number,
    created_at: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = Produit = mongoose.model("produit", ProduitSchema);