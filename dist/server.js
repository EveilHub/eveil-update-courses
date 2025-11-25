"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
//const express = require('express');
// Appel d'express avec TS (TypeScript)
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPDATE_FILE = path_1.default.join(__dirname, "update-dates.json");
const app = (0, express_1.default)();
const PORT = 3000;
// Load
const loadUpdateDates = () => {
    try {
        return JSON.parse(fs_1.default.readFileSync(UPDATE_FILE, "utf8"));
    }
    catch {
        return [];
    }
};
let dateToUpdate = loadUpdateDates();
// Save
const saveUpdateDates = () => {
    try {
        fs_1.default.writeFileSync(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), "utf8");
        console.log("File saved successfully!");
    }
    catch (err) {
        console.error("Erreur lors de la sauvegarde :", err);
    }
};
// Reusable function to convert date
const functionDate = (date) => {
    date.setDate(date.getDate() + 3);
    const nextDates = [
        String(date.getDate()).padStart(2, "0"),
        String(date.getMonth() + 1).padStart(2, "0"),
        date.getFullYear()
    ].join("/");
    return nextDates;
};
// Format date of update
const formatUpdate = (update) => {
    update.setDate(update.getDate() + 54);
    update.setHours(update.getHours() + 8);
    const nextDates = [
        String(update.getDate()).padStart(2, "0"),
        String(update.getMonth() + 1).padStart(2, "0"),
        update.getFullYear()
    ].join("/");
    const hours = String(update.getHours()).padStart(2, "0");
    const minutes = String(update.getMinutes()).padStart(2, "0");
    return `${nextDates} ${hours}:${minutes}`;
};
// Centralize date parsing and handling
const parseDate = (dateStr) => {
    const [dayStr, monthStr, yearStr] = dateStr.split("/");
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    return new Date(year, month - 1, day);
};
const handleIdValue = (idValue, date, semaine, cours) => {
    const parseData = parseDate(date);
    const update = formatUpdate(parseData); // avoid to add 3 days (but 54)
    const nextDates = functionDate(parseData); // add 3 days
    // Prog next update
    if (idValue === 1) {
        console.log("update =>", update);
        //const dataToPush: number = dateToUpdate.push(update);
        // dataToPush;
        // const mapping = dateToUpdate.map((x: string) => x);
        // console.log("update recorded:", mapping);
        dateToUpdate.push(update);
        saveUpdateDates();
        console.log("update recorded:", dateToUpdate);
        return update;
    }
    console.log(`idValue: ${idValue}`, `Semaine: ${semaine}`, `Date: ${nextDates}`, `Cours: ${cours}`);
    return nextDates;
};
// Appel des items depuis la CMS Collection
const fetchCMSData = async () => {
    const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, {
        headers: {
            'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
            'accept-version': '2.0.0'
        }
    });
    const data = await response.json();
    //console.log("data", data);
    const informations = [];
    if (data.items && data.items.length > 0) {
        data.items.forEach((item) => {
            //console.log(item.fieldData);
            const date = item.fieldData.date;
            const semaine = item.fieldData.semaine;
            const cours = item.fieldData.cours;
            const idValue = Number(item.fieldData["id-value"]);
            /*
                id-value correspond à l'id_value de la CMS Collection.
                Webflow le converti en id-value !
                C'est parfait pour la sécurité !!!
                Il faut utiliser Number(item.fieldData["id-value"]),
                dans ce cas !
            */
            if (idValue && semaine && date && cours) {
                informations.push({ idValue, semaine, date, cours });
            }
        });
    }
    // Fixe la date du jour
    const now = new Date();
    now.setHours(8, 0, 0, 0);
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    console.log("*** formattedDate ***", formattedDate);
    // Ordonne la sortie des data par id_value
    informations.sort((a, b) => a.idValue - b.idValue);
    console.log("+++ informations: +++", informations);
    informations.forEach((item) => {
        if (item.idValue >= 1 && item.idValue <= 27) {
            //console.log(`id_value === ${item.idValue} !`);
            handleIdValue(item.idValue, item.date, item.semaine, item.cours);
        }
    });
    return informations;
    // Identifie si la date du jour correspond à la date pour UPDATE !
    // if (dateToUpdate.includes(formattedDate)) {
    // Ordonne la sortie des data par id_value
    // informations.sort((a, b) => a.idValue - b.idValue);
    // console.log("informations:", informations);
    // informations.forEach((item: InformationsType) => {
    //     if (item.idValue >= 1 && item.idValue <= 27) {
    //         //console.log(`id_value === ${item.idValue} !`);
    //         handleIdValue(item.idValue, item.date, item.semaine, item.cours);
    //     }
    // });
    // return informations;
    // } else {
    //     console.log("Nothing to update !", formattedDate);
    //     return formattedDate;
    // }
};
fetchCMSData();
//---
// accepter les ressources pour afficher des data sur page de webflow
// app.use((req: Request, res: Response, next: NextType) => {
//   res.setHeader("Access-Control-Allow-Origin", "*"); 
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type");
//   next();
// });
// app.get('/data', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const data: InformationsType = await fetchCMSData();
//         res.json(data);
//     } catch (error) {
//         res.status(500).send('Erreur lors de la récupération des données');
//     }
// });
//---
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
