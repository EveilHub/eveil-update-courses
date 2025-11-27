"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const UPDATE_FILE = path_1.default.join(__dirname, "update-dates.json");
const app = (0, express_1.default)();
const PORT = 3000;
// Load from JSON file
const loadUpdateDates = () => {
    try {
        return JSON.parse(fs_1.default.readFileSync(UPDATE_FILE, "utf8"));
    }
    catch {
        return [];
    }
};
let dateToUpdate = loadUpdateDates();
// Save in JSON file
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
// Update toutes les 8 semaines, le vendredi à 08:00
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
// -----------
// UPDATE CMS
// -----------
const updateCMSItem = async (itemId, idValue, nouvelleDate) => {
    try {
        const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items/${itemId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
                "accept-version": "2.0.0"
            },
            body: JSON.stringify({
                fieldData: {
                    "id-value": String(idValue),
                    date: nouvelleDate
                }
            })
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur PATCH Webflow :", errorData);
            return;
        }
        //const data = await response.json();
        console.log(`Item ${itemId} mis à jour avec succès:`, nouvelleDate);
        //return;
    }
    catch (err) {
        console.error("Erreur lors du PATCH :", err);
        return;
    }
};
// -----------------------------
// LOGIQUE TRAITEMENT DES DATES
// -----------------------------
const handleIdValue = async (itemId, idValue, date, semaine, cours) => {
    const parseData = parseDate(date);
    const update = formatUpdate(parseData);
    const nextDates = functionDate(parseData);
    const datesPremieresVacances = ['06/01/2026', '07/01/2026', '08/01/2026', '09/01/2026'];
    const datesSecondesVacances = ['20/01/2026', '21/01/2026', '22/01/2026', '23/01/2026'];
    if (idValue === 1) {
        dateToUpdate.push(update);
        saveUpdateDates();
        console.log("Update done !");
    }
    const vacances = datesPremieresVacances.includes(nextDates) || datesSecondesVacances.includes(nextDates);
    if (vacances) {
        console.log("Cette date tombe sur les vacances, pas de mise à jour.");
        return;
    }
    console.log(`Mise à jour CMS pour idValue ${idValue}: ${nextDates}`, "correspondant à", `Semaine ${semaine}`, cours);
    await updateCMSItem(itemId, idValue, nextDates);
};
// -----------------------------
// PUBLICATION SUR SITE WEBFLOW
// -----------------------------
const publishSite = async () => {
    try {
        const response = await fetch(`https://api.webflow.com/v2/sites/${process.env.SITE_ID}/publish`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
                "accept-version": "2.0.0",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "customDomains": [process.env.DOMAIN_ID_1, process.env.DOMAIN_ID_2],
                "publishToWebflowSubdomain": false
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur lors de la publication :", errorData);
            return null;
        }
        const data = await response.json();
        console.log("Site publié avec succès !");
        return data;
    }
    catch (err) {
        console.error("Erreur lors de la publication :", err);
        return null;
    }
};
// ---------------
// FETCH CMS DATA
// ---------------
const fetchCMSData = async () => {
    const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, {
        headers: {
            'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
            'accept-version': '2.0.0'
        }
    });
    const data = await response.json();
    // console.log("data", data);
    // Faut-il vraiement le mettre ici !!!
    const informations = [];
    try {
        if (data.items && data.items.length > 0) {
            data.items.forEach((item) => {
                //console.log(item.fieldData);
                const date = item.fieldData.date;
                const semaine = item.fieldData.semaine;
                const cours = item.fieldData.cours;
                const itemId = item.id;
                const idValue = Number(item.fieldData["id-value"]);
                /*
                    id-value correspond à l'id_value de la CMS Collection.
                    Webflow le converti en id-value !
                    C'est parfait pour la sécurité !!!
                    Il faut utiliser Number(item.fieldData["id-value"]),
                    dans ce cas !
                */
                if (idValue && semaine && date && cours) {
                    informations.push({ itemId, idValue, semaine, date, cours });
                }
            });
        }
    }
    catch (err) {
        console.log("Erreur avec data.items", err);
    }
    // Fixe la date du jour
    const now = new Date();
    /*
        test la date du jour avec 08:00 (il faut supprimer pour la version finale)!!!
    */
    now.setHours(8, 0, 0, 0);
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/` +
        `${String(now.getMonth() + 1).padStart(2, "0")}/` +
        `${String(now.getFullYear())}` + // à vérifier avec String !!!
        `${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    console.log("*** formattedDate ***", formattedDate);
    /*
        Vérifie si la date du jour correspond à la date
        du dernier UPDATE programmé (JSON file)!
    */
    const lastDateRecorded = dateToUpdate.at(-1);
    console.log("** lastDateRecorded **", lastDateRecorded);
    if (lastDateRecorded === formattedDate) {
        try {
            //Ordonne la sortie des data par id_value ASC
            informations.sort((a, b) => a.idValue - b.idValue);
            //console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 27; idValueToUpdate++) {
                const item = informations.find((info) => info.idValue === idValueToUpdate);
                if (item) {
                    await handleIdValue(item.itemId, item.idValue, item.date, item.semaine, item.cours);
                }
            }
        }
        catch (err) {
            console.log("Erreur lors avec informations.sort() et informations.forEach()", err);
        }
        await publishSite();
        return informations;
    }
    else {
        console.log("Nothing to update !", formattedDate);
        return formattedDate;
    }
};
/*
    Fonction cron qui sert à lancer la function fetchCMSData();
    Le lancement est programmé pour chaque vendredi à 08:00 ("* 8 * * 5")
*/
node_cron_1.default.schedule("30 14 * * 4", async () => {
    const now = new Date();
    console.log("------ Cron Job lancé ------");
    console.log(`Date et heure actuelles : ${now.toLocaleString()}`);
    console.log("fetchCMSData() va s'exécuter maintenant !");
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    }
    catch (err) {
        console.error("Erreur lors de fetchCMSData :", err);
    }
    console.log("---------------------------");
});
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
