const express = require("express");
const app = express();
const PORT = process.env.PORT || 4002;
const mongoose = require("mongoose");
const Livraison = require("./livraison");
const axios = require("axios");

app.use(express.json());

mongoose.set("strictQuery", true);
mongoose.connect("mongodb://127.0.0.1/livraison-service")
    .then(() => console.log("livraison-service DB Connected"))
    .catch(error => console.log(error));

async function verifierCommande(commande_id) {
    try {
        const response = await axios.get(`http://localhost:4001/commande/${commande_id}`);
        return response.data;
    } catch (error) {
        throw new Error("Commande non trouvée");
    }
}

app.post("/livraison/ajouter", async (req, res) => {
    try {
        const { commande_id, transporteur_id, adresse_livraison } = req.body;
        await verifierCommande(commande_id);
        
        const newLivraison = new Livraison({
            commande_id,
            transporteur_id,
            adresse_livraison,
            statut: "En attente"
        });
        
        const livraison = await newLivraison.save();
        res.status(201).json(livraison);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.put("/livraison/:id", async (req, res) => {
    try {
        const { statut } = req.body;
        const livraison = await Livraison.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );
        
        if (!livraison) {
            return res.status(404).json({ message: "Livraison non trouvée" });
        }
        
        res.status(200).json(livraison);
    } catch (error) {
        res.status(400).json({ error });
    }
});

app.listen(PORT, () => {
    console.log(`Livraison-service at ${PORT}`);
});