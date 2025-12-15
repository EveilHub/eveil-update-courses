"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const redis_1 = require("@upstash/redis");
const express_1 = __importDefault(require("express"));
const dateUtils_1 = require("./utils/dateUtils");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Stock les data
let informations = [];
const redis = new redis_1.Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
// ----------------------------------------
// Charger - Ajouter les dates depuis Redis
// ----------------------------------------
const addDate = async (date) => {
    const raw = await redis.get('update_dates');
    // Sécurité maximale
    if (typeof raw !== 'string') {
        const dates = { "0": date };
        await redis.set('update_dates', JSON.stringify(dates));
        return;
    }
    const dates = JSON.parse(raw);
    if (Object.values(dates).includes(date))
        return;
    const nextIndex = Object.keys(dates).length;
    dates[nextIndex] = date;
    await redis.set('update_dates', JSON.stringify(dates));
};
const getLastDate = async () => {
    const raw = await redis.get("update_dates");
    if (!raw)
        return null;
    if (typeof raw === "object" && raw !== null) {
        return raw["0"] ?? null;
    }
    if (typeof raw === "string") {
        try {
            const dates = JSON.parse(raw);
            return dates["0"] ?? null;
        }
        catch (err) {
            console.error("Erreur JSON.parse:", err, raw);
            return null;
        }
    }
    return null;
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
const handleIdValue = async (itemId, idValue, date, semaine, cours, formattedDate) => {
    // Formatage des dates
    const formatData = (0, dateUtils_1.parseDate)(date);
    const formatDateAujourdHui = (0, dateUtils_1.parseDate)(formattedDate);
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
    const aujourdHui = new Date();
    const moisActuel = aujourdHui.getMonth();
    if (moisActuel === 0) {
        await redis.set("update_dates", JSON.stringify({}));
    }
    ;
    if (idValue === 1) {
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
                    console.log("!!! Ces dates tombent sur la 1ère semaine vacances !!!", nextItem.itemId, nextItem.idValue, noDates);
                    await updateCMSItem(nextItem.itemId, nextItem.idValue, noDates);
                    return;
                }
                return;
            }
        }
        else {
            console.log(`2) MAJ du CMS par idValue ${idValue}: ${nextDate}`, "correspondant à", `Semaine ${semaine}`, cours);
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
    const now = new Date();
    // Fn() qui sert à formatter les dates pour ci-dessous
    const pad = (n) => String(n).padStart(2, "0");
    const day = pad(now.getUTCDate());
    const month = pad(now.getUTCMonth() + 1);
    const year = now.getUTCFullYear();
    const hours = pad(now.getUTCHours());
    const minutes = pad(now.getUTCMinutes());
    // Date du jour (vendredi) à comparer avec le vendredi de la semaine du nouvel an
    const formattedDate = `${day}/${month}/${year}`;
    // Date du jour (vendredi) à comparer avec la date du fichier update-dates.json
    const formattedDateHoursMin = `${formattedDate} ${hours}:${minutes}`;
    // Date du fichier update-dates.json (vendredi)
    const lastFridayJsonRecorded = await getLastDate();
    console.log("lastFridayJsonRecorded", lastFridayJsonRecorded);
    // Instancie le 1er vendredi de l'année qui tombe sur la semaine du nouvel an
    const currentYear = new Date().getFullYear();
    const lastWeeksPerYear = (0, dateUtils_1.deuxDernieresSemaines)(currentYear);
    const secondFridayHoliday = lastWeeksPerYear.derniereSemaine.vendredi;
    /*
        Si le dernier vendredi enregistré dans "update-dates.json" correspond
        à aujourd'hui, ou si le 1er vendredi de l'année correspond à la date
        d'aujourd'hui => handleIdValue() est appelée.
    */
    if (formattedDateHoursMin === lastFridayJsonRecorded || formattedDate === secondFridayHoliday) {
        try {
            informations.sort((a, b) => a.idValue - b.idValue);
            // console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 72; idValueToUpdate++) {
                const item = informations.find((info) => info.idValue === idValueToUpdate);
                if (item) {
                    await handleIdValue(item.itemId, item.idValue, item.date, item.semaine, item.cours, formattedDate);
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
        console.log("Nothing to update !", formattedDateHoursMin);
        return { updated: false, message: "Rien à mettre à jour aujourd'hui." };
    }
};
/*
    Lancement de la fonction fetchCMSData() programmé pour
    chaque vendredi à 08:00 ("0 7 * * 5")
*/
node_cron_1.default.schedule("15 15 * * 1", async () => {
    const today = new Date();
    //console.log(`Date et heure actuelles : ${today.toLocaleString()}`);
    const dateUTC = today.toLocaleDateString("fr-FR", {
        timeZone: "UTC",
    });
    console.log("------ Cron Job lancé ------");
    console.log(`Date UTC : ${dateUTC}`);
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    }
    catch (err) {
        console.error("Erreur lors de fetchCMSData() :", err);
    }
    console.log("---------------------------");
}, {
    timezone: "UTC",
});
app.get("/health", (req, res) => {
    res.status(200).json({ status: "API is running !" });
});
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
