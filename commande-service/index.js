const express = require("express");
const app = express();
const PORT = process.env.PORT || 4001;
const mongoose = require("mongoose");
const Commande = require("./commande");
const axios = require("axios");
require("dotenv").config();

app.use(express.json());

mongoose.set("strictQuery", true);
mongoose.connect("mongodb://127.0.0.1/commande-service")
    .then(() => {
        console.log("commande-service DB Connected");
    })
    .catch((error) => console.log(error));

async function verifierProduitsEtCalculerPrix(produits) {
    let prixTotal = 0;
    
    for (const item of produits) {
        try {
            const response = await axios.get(`http://localhost:4000/produit/${item.produit_id}`);
            const produit = response.data;
            
            if (produit.stock < item.quantite) {
                throw new Error(`Stock insuffisant pour le produit ${produit.nom}`);
            }
            
            prixTotal += produit.prix * item.quantite;
        } catch (error) {
            throw error;
        }
    }
    
    return prixTotal;
}

async function mettreAJourStock(produits) {
    for (const item of produits) {
        try {
            await axios.patch(`http://localhost:4000/produit/${item.produit_id}/stock`, {
                stock: -item.quantite 
            });
        } catch (error) {
            throw error;
        }
    }
}

app.post("/commande/ajouter", async (req, res) => {
    try {
        const { produits, client_id } = req.body;
        const prix_total = await verifierProduitsEtCalculerPrix(produits);
        const newCommande = new Commande({
            produits,
            client_id,
            prix_total,
            statut: "En attente"
        });
        const commande = await newCommande.save();
        
        await mettreAJourStock(produits);
        
        res.status(201).json(commande);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get("/commande/:id", async (req, res) => {
    try {
        const commande = await Commande.findById(req.params.id);
        if (!commande) {
            return res.status(404).json({ message: "Commande non trouvée" });
        }
        res.status(200).json(commande);
    } catch (error) {
        res.status(400).json({ error });
    }
});

app.patch("/commande/:id/statut", async (req, res) => {
    try {
        const { statut } = req.body;
        const commande = await Commande.findByIdAndUpdate(
            req.params.id,
            { statut },
            { new: true }
        );
        
        if (!commande) {
            return res.status(404).json({ message: "Commande non trouvée." });
        }
        
        res.status(200).json(commande);
    } catch (error) {
        res.status(400).json({ error });
    }
});

app.listen(PORT, () => {
    console.log(`Commande-service at ${PORT}`);
});