"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require('dotenv');
const cron = require('node-cron');
const express = require("express");
const fs = require('fs').promises;
const path = require("path");
const dateUtils_1 = require("./utils/dateUtils");
dotenv.config();
const UPDATE_FILE = path.join(__dirname, "./utils/update-dates.json");
const app = express();
const PORT = 3000;
// Retrieve informations from CMS Collection
const informations = [];
// Load from JSON file
const loadUpdateDates = async () => {
    try {
        const data = await fs.readFile(UPDATE_FILE, 'utf8');
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
        await fs.writeFile(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), 'utf8');
        console.log("Update (friday) saved successfully!");
    }
    catch (err) {
        console.error("Erreur lors de la sauvegarde du vendredi :", err);
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
        console.log(`Item ${itemId} mis à jour avec succès:`, nouvelleDate);
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
    /*
        Update des dates dans la CMS Collection, 63 jours après
        la date inscrite dans la CMS Collection, selon (update)
    */
    let nextDate = (0, dateUtils_1.functionDate)(formatData); // Déjà +63j !!!
    // Update prog le vendredi de la 8ème semaines, à 08:00
    const update = (0, dateUtils_1.formatUpdateFriday)(formatUpdateData);
    // Si les dates tombent sur les vacances
    const noDates = "--/--/----";
    /*
        Génère des dates pour les 8ère semaines de l'année
        pour n'importe quelle année, à partir du vendredi
        de la semaine du nouvel an. Soit 1 semaine avant
        la génération des dates pour les 8 semaines.
    */
    const currentYear = new Date().getFullYear();
    let coursesForStartYear = (0, dateUtils_1.generateCourseDates)(currentYear);
    //console.log("generation dates for coursesForStartYear", coursesForStartYear);
    /*
        Calcul des 2 dernières semaines de l'année en cours.
        La 1ère comprend Noël et la seconde comprend nouvel an.
    */
    const lastWeeksPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    // 1er et second lundi des vacances
    const firstLundiVacances = lastWeeksPerYear.avantDerniereSemaine.debut;
    const secondLundiVacances = lastWeeksPerYear.derniereSemaine.debut;
    // console.log("+ Dates 1er lundi et 1er vendredi (vacances)", firstLundiVacances);
    // console.log("++ Dates 2er lundi et 2er vendredi (vacances)", secondLundiVacances);
    const aujourdHui = new Date();
    const moisActuel = aujourdHui.getMonth();
    // console.log("nextDate", nextDate);
    if (moisActuel === 1) {
        // +63j
        // console.log("Mois actuel > janvier", moisActuel);
        if (idValue === 1) {
            dateToUpdate.push(update);
            await saveUpdateDates();
            console.log("Update programmer pour dans 8 semaines !");
        }
        else {
            console.log("No item to update !");
        }
        if ((nextDate === firstLundiVacances)) {
            const currentIndex = informations.findIndex((info) => info.idValue === idValue);
            if (currentIndex !== -1) { // 18 = 2 x 9 cours = 2 semaines vacances
                for (let i = currentIndex; i < informations.length; i++) {
                    const nextItem = informations[i];
                    console.log("!!! Ces dates tombent sur la 1ère semaine vacances !!!", nextItem.idValue, noDates, nextItem.cours);
                    //await updateCMSItem(nextItem.itemId, nextItem.idValue, noDates);
                }
                return;
            }
        }
        else if ((nextDate !== firstLundiVacances) && (nextDate !== secondLundiVacances)) {
            console.log(`1) MAJ du CMS par idValue ${idValue}: ${nextDate}`, "correspondant à", `Semaine ${semaine}`, cours);
            //await updateCMSItem(itemId, idValue, nextDate);
        }
        else {
            console.log(`2) MAJ du CMS par idValue ${idValue}: ${nextDate}`, "correspondant à", `Semaine ${semaine}`, cours);
            // await updateCMSItem(itemId, idValue, nextDate);
        }
    }
    else if (moisActuel === 11) {
        if (idValue === 1) {
            dateToUpdate.push(update);
            await saveUpdateDates();
            console.log("Update programmer pour dans 8 semaines !");
        }
        else {
            console.log("No item to update !");
        }
        // Génère les dates pour les 8 première semaines de l'année
        const secondIndex = informations.findIndex((info) => info.idValue === idValue);
        if (secondIndex !== -1) {
            for (let i = secondIndex; i < informations.length; i++) {
                const nextItem_2 = informations[i];
                let course = coursesForStartYear[i];
                console.log(nextItem_2.itemId, nextItem_2.idValue, `Date of courses: ${course.date}`);
                // await updateCMSItem(nextItem_2.itemId, nextItem_2.idValue, course.date);
                return;
            }
            ;
            return;
        }
    }
    else {
        console.log("Error: something went wrong with month !!!");
    }
    ;
    // if (idValue === 1) {
    //     dateToUpdate.push(update);
    //     await saveUpdateDates();
    //     console.log("Update programmer pour dans 8 semaines !");
    // } else {
    //     console.log("No item to update !");
    // }
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
    // --- À retirer en version finale ---
    now.setHours(8, 0, 0, 0);
    // --- ----------------------------- ---
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const formattedDate = `${day}/${month}/${year}`;
    const formattedDateHoursMin = `${formattedDate} ${hours}:${minutes}`;
    // console.log("*** formattedDateHoursMin ***", formattedDateHoursMin);
    // console.log("*** formattedDate ***", formattedDate);
    /*
        Vérifie si la date du jour correspond à la date
        du dernier UPDATE programmé (JSON file)!
    */
    const lastFridayJsonRecorded = dateToUpdate.at(-1);
    // console.log("*** lastFridayJsonRecorded ***", lastFridayJsonRecorded);
    const currentYear = new Date().getFullYear();
    const lastWeeksPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    const secondFridayHoliday = lastWeeksPerYear.derniereSemaine.fin;
    /*
        Si le dernier vendredi enregistrer dans le fichier json correspond à aujourd'hui,
        ou si le 1er vendredi de l'année correspond à la date d'aujourd'hui la fn()
        handleIdValue() est appelée.
    */
    if (formattedDateHoursMin === lastFridayJsonRecorded || formattedDate === secondFridayHoliday) {
        try {
            informations.sort((a, b) => a.idValue - b.idValue);
            // console.log("informations:", informations);
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
        console.log("Nothing to update !", formattedDateHoursMin);
        return formattedDateHoursMin;
    }
};
//fetchCMSData();
/*
    Fonction cron qui sert à lancer la function fetchCMSData();
    Le lancement est programmé pour chaque vendredi à 08:00 ("* 8 * * 5")
*/
cron.schedule("32 11 * * 1", async () => {
    const now = new Date();
    console.log("------ Cron Job lancé ------");
    console.log(`Date et heure actuelles : ${now.toLocaleString()}`);
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    }
    catch (err) {
        console.error("Erreur lors de fetchCMSData() :", err);
    }
    console.log("---------------------------");
});
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
