"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const node_cron_1 = __importDefault(require("node-cron"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const dateUtils_1 = require("./dateUtils");
dotenv_1.default.config();
const UPDATE_FILE = path_1.default.join(__dirname, "update-dates.json");
const app = (0, express_1.default)();
const PORT = 3000;
// Load from JSON file
const loadUpdateDates = async () => {
    try {
        const data = await fs_1.promises.readFile(UPDATE_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
};
let dateToUpdate = [];
// On charge les données au démarrage
(async () => {
    dateToUpdate = await loadUpdateDates();
})();
// Save in JSON file (async)
const saveUpdateDates = async () => {
    try {
        await fs_1.promises.writeFile(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), 'utf8');
        console.log("Update standard saved successfully!");
    }
    catch (err) {
        console.error("Erreur lors de la sauvegarde standard :", err);
    }
};
// Erase JSON file completely & write new value of date (new year)
const overwriteFile = async () => {
    try {
        await fs_1.promises.writeFile(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), "utf8");
        console.log(`Le fichier ${UPDATE_FILE} a été écrasé avec succès.`);
    }
    catch (err) {
        console.error('Erreur lors de l\'écriture du fichier', err);
    }
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
    const formatData = (0, dateUtils_1.parseDate)(date);
    const formatUpdateData = (0, dateUtils_1.parseDate)(date);
    // MAJ des dates dans la CMS Collection,
    // 63 jours après, selon (update)
    const nextDates = (0, dateUtils_1.functionDate)(formatData);
    const noDates = "--/--/----";
    // Update prog dans 8 semaines, le vendredi à 08:00
    const update = (0, dateUtils_1.formatUpdate)(formatUpdateData);
    // Calcul des 2 dernières semaines de l'année en cours
    const currentYear = new Date().getFullYear();
    const lastWeekPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    const firstEndLastWeek = lastWeekPerYear.avantDerniereSemaine.debut;
    const endValDate = lastWeekPerYear.derniereSemaine.fin;
    //console.log("dates 2 dernières semaines de l'année en cours", firstEndLastWeek, endValDate);
    const valOfFirstEnd = firstEndLastWeek.includes(nextDates);
    // A vérifier
    // Date du début d'année pour 10 ans... Il en manque 2...
    const datesPremieresDates = ['05/01/2026', '04/01/2027', '03/01/2028',
        '08/01/2029', '07/01/2030', '06/01/2031', '05/01/2032', '03/01/2033'];
    const datesStart = datesPremieresDates.includes(nextDates);
    // update dans 8 semaines
    if (idValue === 1) {
        dateToUpdate.push(update);
        await saveUpdateDates();
        console.log("Update programmer pour dans 8 semaines !");
        return;
    }
    // dates de début d'année
    if (datesStart) {
        dateToUpdate.push(update);
        await overwriteFile();
        console.log("!!! Happy New Year !!! Update programmer pour dans 8 semaines !");
        //await updateCMSItem(itemId, idValue, nextDates);
        return;
    }
    // nextDates est égale au lundi avantDerniereSemaine de la date de fin d'année
    if (nextDates === firstEndLastWeek) {
        console.log("!!! Ces dates tombent sur les vacances !!!");
        console.log("itemId - idValue - semaine - noDates, nextDates", itemId, idValue, semaine, noDates, nextDates);
        //await updateCMSItem(itemId, idValue, noDates);
        return;
    }
    ;
    console.log(`MAJ du CMS par idValue ${idValue}: ${nextDates}`, "correspondant à", `Semaine ${semaine}`, cours);
    //await updateCMSItem(itemId, idValue, nextDates);
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
    // Retrieve informations from CMS Collection
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
        `${String(now.getFullYear())}` +
        ` ${String(now.getHours()).padStart(2, "0")}:` +
        `${String(now.getMinutes()).padStart(2, "0")}`;
    console.log("*** formattedDate ***", formattedDate);
    /*
        Vérifie si la date du jour correspond à la date
        du dernier UPDATE programmé (JSON file)!
    */
    const lastDateRecorded = dateToUpdate.at(-1);
    console.log("** lastDateRecorded **", lastDateRecorded);
    console.log("formattedDate", formattedDate);
    if (lastDateRecorded === formattedDate) {
        try {
            //Ordonne la sortie des data par id_value ASC
            informations.sort((a, b) => a.idValue - b.idValue);
            //console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 36; idValueToUpdate++) {
                const item = informations.find((info) => info.idValue === idValueToUpdate);
                if (item) {
                    await handleIdValue(item.itemId, item.idValue, item.date, item.semaine, item.cours);
                }
                ;
            }
            ;
        }
        catch (err) {
            console.log("Erreur lors avec informations.sort() et informations.forEach()", err);
        }
        //await publishSite();
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
node_cron_1.default.schedule("54 10 * * 3", async () => {
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
