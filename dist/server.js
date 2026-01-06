"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
require("dotenv/config");
const node_cron_1 = __importDefault(require("node-cron"));
const express_1 = __importDefault(require("express"));
const dateUtils_1 = require("./utils/dateUtils");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3000;
// Stock les data
let informations = [];
const filePath = path_1.default.join(__dirname, "./utils/update-dates.json");
// SAUVEGARDE LES DATES DANS update-dates.json
const addDate = async (dataDate) => {
    let items = [];
    if (fs_1.default.existsSync(filePath)) {
        try {
            const raw = await fs_1.default.promises.readFile(filePath, "utf-8");
            items = JSON.parse(raw);
        }
        catch (err) {
            console.error("Erreur lecture JSON:", err);
            items = [];
        }
    }
    items.push(dataDate);
    await fs_1.default.promises.writeFile(filePath, JSON.stringify(items, null, 2), "utf-8");
};
// LECTURE DE LA DERNIERE VALEUR DANS update-dates.json
const getLastDate = async () => {
    try {
        await fs_1.default.promises.access(filePath);
        const raw = await fs_1.default.promises.readFile(filePath, "utf-8");
        const dates = JSON.parse(raw);
        if (dates.length === 0)
            return null;
        return dates[dates.length - 1];
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            console.error("Erreur lors de la lecture de await getLastDate:", err);
        }
        return null;
    }
};
// EFFACE COMPLETEMENT LE TABLEAU DU update-dates.json
const clearArray = async () => {
    try {
        await fs_1.default.promises.writeFile(filePath, JSON.stringify([], null, 2), "utf-8");
        console.log("Le tableau a été vidé !");
    }
    catch (err) {
        console.error("Erreur lors de la suppression :", err);
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
            throw new Error(`Update échoué: ${JSON.stringify(errorData)}`);
        }
        console.log(`Cours ${itemId} mis à jour avec succès:`, nouvelleDate);
    }
    catch (err) {
        console.error("Erreur lors du PATCH :", err);
        throw err;
    }
};
// -----------------------------
// LOGIQUE TRAITEMENT DES DATES
// -----------------------------
const handleIdValue = async (itemId, idValue, date, semaine, cours, todayDate) => {
    // Formatage des dates
    const formatData = (0, dateUtils_1.parseDate)(date);
    const formatDateAujourdHui = (0, dateUtils_1.parseDate)(todayDate);
    // Date générée avec +63 jours
    let nextDate = (0, dateUtils_1.functionDate)(formatData);
    // Si les dates de nextDate tombent sur les vacances
    const noDates = "--/--/----";
    // Update le vendredi de la 8ème semaine, à 08:00
    const update = (0, dateUtils_1.formatUpdateFriday)(formatDateAujourdHui);
    /*
        Génère des dates pour les 8ère semaines de l'année
        pour n'importe quelle année, à partir du vendredi
        de la semaine du nouvel an. Soit 1 semaine avant
        la génération des dates pour les 8 semaines.
    */
    const currentYear = new Date().getFullYear();
    let coursesForStartYear = (0, dateUtils_1.generateCourseDates)(currentYear);
    /*
        Calcul des 2 dernières semaines de l'année en cours.
        La 1ère comprend Noël et la seconde comprend nouvel an.
    */
    const lastWeeksPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    const holidays = Object.values(lastWeeksPerYear).flatMap((week) => Object.values(week));
    const verifyHolidays = holidays.includes(nextDate);
    // Détermine si on est en janvier
    const aujourdHui = new Date();
    const moisActuel = aujourdHui.getMonth();
    // Détermine l'année
    let parts = nextDate.split("/");
    let yearOfNexDate = parts[2];
    if ((moisActuel === 0) && (idValue === 1)) {
        await clearArray();
        await addDate(update);
    }
    else if ((moisActuel !== 0) && (idValue === 1)) {
        await addDate(update);
    }
    else {
        console.log("No item to update !");
    }
    ;
    if (moisActuel > 0) {
        if (verifyHolidays) {
            // Génère "--/--/----" pour les jours restants pour les 8 semaines
            const currentIndex = informations.findIndex((info) => info.idValue === idValue);
            if (currentIndex !== -1) {
                for (let i = currentIndex; i < informations.length; i++) {
                    const nextItem = informations[i];
                    console.log("1) Ces dates tombent sur les 2 semaines de vacances !!!", nextItem.itemId, nextItem.idValue, noDates);
                    await updateCMSItem(nextItem.itemId, nextItem.idValue, noDates);
                    return;
                }
                return;
            }
        }
        else if (Number(yearOfNexDate) !== currentYear) {
            // Génère "--/--/----" pour les jours restants si l'année est différente
            console.log("2) Dates après vancances", idValue, nextDate, semaine, cours);
            await updateCMSItem(itemId, idValue, noDates);
        }
        else {
            // MAJ des dates avec nextDate
            console.log(`3) MAJ du CMS par idValue ${idValue}: ${nextDate}`, "correspondant à", `Semaine ${semaine}`, cours);
            await updateCMSItem(itemId, idValue, nextDate);
        }
    }
    else if (moisActuel === 0) {
        // Génère les dates pour les 8 première semaines de l'année
        const secondIndex = informations.findIndex((info) => info.idValue === idValue);
        if (secondIndex !== -1) {
            for (let i = secondIndex; i < informations.length; i++) {
                const nextItem_2 = informations[i];
                let course = coursesForStartYear[i];
                console.log(nextItem_2.itemId, nextItem_2.idValue, `Date of courses: ${course.date}`);
                await updateCMSItem(nextItem_2.itemId, nextItem_2.idValue, course.date);
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
            throw new Error("Publication échouée...");
        }
        const data = await response.json();
        console.log("Site publié avec succès !");
        return data;
    }
    catch (err) {
        console.error("Erreur lors de la publication :", err);
        throw err;
    }
};
// ---------------
// FETCH CMS DATA
// ---------------
const fetchCMSData = async () => {
    informations = [];
    try {
        const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, {
            headers: {
                'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
                'accept-version': '2.0.0'
            }
        });
        if (!response.ok) {
            throw new Error(`Webflow API error: ${response.status}`);
        }
        const data = await response.json();
        // console.log("data", data);
        if (data.items && data.items.length > 0) {
            data.items.forEach((item) => {
                //console.log(item.fieldData);
                const date = item.fieldData.date;
                const semaine = item.fieldData.semaine;
                const cours = item.fieldData.cours;
                const itemId = item.id;
                const idValue = Number(item.fieldData["id-value"]);
                if (!isNaN(idValue) && semaine && date && cours) {
                    informations.push({ itemId, idValue, semaine, date, cours });
                }
            });
        }
    }
    catch (err) {
        console.error("Erreur lors de la récupération des données Webflow :", err);
        return { updated: false, message: `Erreur: ${err.message || err}` };
    }
    // Fixe la date du jour
    const dateNow = new Date();
    // Fn() qui sert à mettre un 0 pour les chiffre entre 0-9 pour les dates ci-dessous
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(dateNow.getDate());
    const month = pad(dateNow.getMonth() + 1);
    const year = dateNow.getFullYear();
    const hours = pad(dateNow.getHours());
    const minutes = pad(dateNow.getMinutes());
    // Date du jour (vendredi) à comparer avec le vendredi de la semaine du nouvel an
    const todayDate = `${day}/${month}/${year}`;
    // Date du jour (vendredi) à comparer avec la date du fichier update-dates.json
    const todayDateHourMin = `${todayDate} ${hours}:${minutes}`;
    // Date du fichier update-dates.json (vendredi)
    const lastFridayJsonRecorded = await getLastDate();
    // Instancie le 1er vendredi de l'année qui tombe sur la semaine du nouvel an
    const currentYear = new Date().getFullYear();
    const lastWeeksPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    const secondFridayHoliday = lastWeeksPerYear.derniereSemaine.vendredi;
    /*
        Si le dernier vendredi enregistré dans "update-dates.json" correspond
        à aujourd'hui, ou si le 1er vendredi de l'année correspond à la date
        d'aujourd'hui => handleIdValue() est appelée.
    */
    if (todayDateHourMin === lastFridayJsonRecorded || todayDate === secondFridayHoliday) {
        try {
            informations.sort((a, b) => a.idValue - b.idValue);
            // console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 72; idValueToUpdate++) {
                const item = informations.find((info) => info.idValue === idValueToUpdate);
                if (item) {
                    await handleIdValue(item.itemId, item.idValue, item.date, item.semaine, item.cours, todayDate);
                }
                ;
            }
            ;
            await publishSite();
            return { updated: true, message: "Mises à jour effectuées avec succès." };
        }
        catch (err) {
            console.error("Erreur lors du traitement des informations :", err);
            return { updated: false, message: `Erreur lors du traitement: ${err.message || err}` };
        }
    }
    else {
        console.log("Nothing to update !", todayDateHourMin);
        return { updated: false, message: "Rien à mettre à jour aujourd'hui." };
    }
};
// Lancement de la fonction fetchCMSData() chaque vendredi à 08:00 ("0 8 * * 5")
node_cron_1.default.schedule("0 8 * * 5", async () => {
    const triggerDate = new Date();
    console.log("------ Cron Job lancé ------");
    console.log("Date locale :", triggerDate.toLocaleString("fr-FR", { timeZone: "Europe/Paris" }));
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    }
    catch (err) {
        console.error("Erreur lors de fetchCMSData() :", err);
    }
    console.log("---------------------------");
}, {
    timezone: "Europe/Paris",
});
// test with http://127.0.0.1:${PORT}/api
app.get("/api", (req, res) => {
    res.status(200).send("Eveil API OK !");
});
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le PORT: ${PORT}`);
});
