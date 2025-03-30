const express = require("express");
const app = express();
const PORT = process.env.PORT_ONE || 4003;
const mongoose = require("mongoose");
const Utilisateur = require("./utilisateur");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

mongoose.set("strictQuery",true);
mongoose
.connect("mongodb://127.0.0.1/auth-service")
.then(()=>{
    console.log("Auth-Service DB Connected");
}).catch((error)=>console.log(error));

app.use(express.json());

app.post("/auth/register", async (req, res) => {
    const { nom, email, mot_de_passe } = req.body;

    const userExists = await Utilisateur.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "Cet utilisateur existe déjà" });
    }

    const hash = await bcrypt.hash(mot_de_passe, 10);

    const newUtilisateur = new Utilisateur({
        nom,
        email,
        mot_de_passe: hash,
    });

    const savedUser = await newUtilisateur.save();
    res.status(201).json(savedUser);
});

app.post("/auth/login", async (req, res) => {
    const { email, mot_de_passe } = req.body;
    const utilisateur = await Utilisateur.findOne({ email });
    if (!utilisateur) {
        return res.json({ message: "Utilisateur introuvable" });
    } else {
        bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe).then(resultat => {
            if (!resultat) {
                return res.json({ message: "Mot de passe incorrect" });
            } else {
                const payload = {
                    email,
                    nom: utilisateur.nom
                };
                jwt.sign(payload, "secret", (err, token) => {
                    if (err) console.log(err);
                    else return res.json({ token });
                });
            }
        });
    }
});

app.get("/auth/profil", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    jwt.verify(token, "secret", (err, decoded) => {
        if (err) return res.status(401).json({ message: "Token invalide" });
        
        Utilisateur.findOne({ email: decoded.email })
            .then(utilisateur => {
                if (!utilisateur) return res.status(404).json({ message: "Utilisateur introuvable" });
                res.json(utilisateur);
            })
            .catch(error => res.status(400).json({ error }));
    });
});

app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
});