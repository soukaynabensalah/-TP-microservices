const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require("mongoose");
const Produit = require("./Produit");

app.use(express.json());

mongoose.set("strictQuery", true);
mongoose.connect("mongodb://127.0.0.1/produit-service")
    .then(() => {
        console.log("produit-service DB Connected");
    })
    .catch((error) => console.log(error));

// Ajouter un nouveau produit
app.post("/produit/ajouter", (req, res) => {
    const { nom, description, prix, stock } = req.body;
    const newProduit = new Produit({
        nom,
        description,
        prix,
        stock
    });
    newProduit.save()
        .then(produit => res.status(201).json(produit))
        .catch(error => res.status(400).json({ error }));
});

// Récupérer un produit spécifique
app.get("/produit/:id", (req, res) => {
    Produit.findById(req.params.id)
        .then(produit => {
            if (!produit) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }
            res.status(200).json(produit);
        })
        .catch(error => res.status(400).json({ error }));
});

// Mettre à jour le stock d'un produit
app.patch("/produit/:id/stock", (req, res) => {
    const { stock } = req.body;
    Produit.findByIdAndUpdate(
        req.params.id,
        { stock },
        { new: true }
    )
        .then(produit => {
            if (!produit) {
                return res.status(404).json({ message: "Produit non trouvé" });
            }
            res.status(200).json(produit);
        })
        .catch(error => res.status(400).json({ error }));
});

app.listen(PORT, () => {
    console.log(`produit-service at ${PORT}`);
});