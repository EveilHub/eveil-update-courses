import type { DataType, ItemsType, InformationsType, EndDatesYearsTypes } from "./types";
import dotenv from 'dotenv';
import express from 'express';
import cron from 'node-cron';
import { promises as fs } from 'fs';
import path from 'path';
import { parseDate, functionDate, formatUpdateFriday, deuxDernieresSemaines, formatHolidayUpdate } from './dateUtils';
dotenv.config();

const UPDATE_FILE = path.join(__dirname, "update-dates.json");

const app = express();
const PORT: number = 3000;

    // Retrieve informations from CMS Collection
    const informations: InformationsType[] = [];

// Load from JSON file
const loadUpdateDates = async (): Promise<string[]> => {
    try {
        const data = await fs.readFile(UPDATE_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

let dateToUpdate: string[] = [];

// On charge les données au démarrage
(async () => {
    dateToUpdate = await loadUpdateDates();
})();

// Save in JSON file (async)
const saveUpdateDates = async (): Promise<void> => {
    try {
        await fs.writeFile(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), 'utf8');
        console.log("Update standard saved successfully!");
    } catch (err) {
        console.error("Erreur lors de la sauvegarde standard :", err);
    }
};

// Erase JSON file completely & write new value of date (new year)
const overwriteFile = async (): Promise<void> => {
    try {
        await fs.writeFile(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), "utf8");
        console.log(`Le fichier ${UPDATE_FILE} a été écrasé avec succès.`);
    } catch (err) {
        console.error('Erreur lors de l\'écriture du fichier', err);
    }
};

// -----------
// UPDATE CMS
// -----------
const updateCMSItem = async (itemId: string, idValue: number, nouvelleDate: string): Promise<void> => {
    try {
        const response = await fetch(
            `https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items/${itemId}`, 
                {
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
                }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur PATCH Webflow :", errorData);
            return;
        }

        //const data = await response.json();
        console.log(`Item ${itemId} mis à jour avec succès:`, nouvelleDate);
        //return;
    } catch (err) {
        console.error("Erreur lors du PATCH :", err);
        return;
    }
};

// -----------------------------
// LOGIQUE TRAITEMENT DES DATES
// -----------------------------
const handleIdValue = async (
    itemId: string, 
    idValue: number, 
    date: string, 
    semaine: string, 
    cours: string
): Promise<void> => {

    const formatData: Date = parseDate(date);
    const formatUpdateData: Date = parseDate(date);

    // MAJ des dates dans la CMS Collection,
    // 63 jours après, selon (update)
    let nextDate: string = functionDate(formatData);
    const noDates: string = "--/--/----";

    // Update prog dans 8 semaines, le vendredi à 08:00
    const update: string = formatUpdateFriday(formatUpdateData);

    // Update prog -3 jours, le vendredi à 08:00
    const formatHolidayData: Date = parseDate(nextDate);
    const updateHoliday: string = formatHolidayUpdate(formatHolidayData);

    // Calcul des 2 dernières semaines de l'année en cours
    const currentYear: number = new Date().getFullYear();
    const lastWeekPerYear: EndDatesYearsTypes = deuxDernieresSemaines(currentYear);
    const firstEndLastWeek: string = lastWeekPerYear.avantDerniereSemaine.debut;
    //const endValDate: string = lastWeekPerYear.derniereSemaine.fin;
    //console.log("++ Dates 2 dernières semaines de l'année en cours", firstEndLastWeek, endValDate);

    // A vérifier
    // Date du début d'année pour 10 ans... Il en manque 2...
    const datesPremieresDates: string[] = ['05/01/2026', '04/01/2027', '03/01/2028', 
        '08/01/2029', '07/01/2030', '06/01/2031', '05/01/2032', '03/01/2033'];

    const datesStartYear: boolean = datesPremieresDates.includes(nextDate);
    console.log(datesStartYear, "datesStartYear");

    // Dates des vacances
    if (nextDate !== firstEndLastWeek) {
        console.log(`MAJ du CMS par idValue ${idValue}: ${nextDate}`, 
            "correspondant à", `Semaine ${semaine}`, cours);
        //await updateCMSItem(itemId, idValue, nextDate);
    } else if (nextDate === firstEndLastWeek) {
        const currentIndex = informations.findIndex((info: { idValue: number; }) => 
            info.idValue === idValue
        );
        if (currentIndex !== -1) { // 18 = 2 x 9 cours = 2 semaines vacances
            for (let i = currentIndex; i < informations.length; i++) {
                const nextItem = informations[i];
                console.log("!!! Ces dates tombent sur les vacances !!!", nextItem.idValue, noDates, nextItem.cours);
                //await updateCMSItem(nextItem.itemId, nextItem.idValue, noDates);
            }
        }
        return;
    }

    // Update dans 8 semaines
    if (idValue === 1) {
        dateToUpdate.push(update);
        await saveUpdateDates();
        //await overwriteFile();
        console.log("Update programmer pour dans 8 semaines !");
        return;
    } else if (datesStartYear && idValue !== 1) {
        // Update dans - 3 jours
        dateToUpdate.push(updateHoliday);
        await overwriteFile();
        console.log("!!! Happy New Year !!! Update programmer pour dans 8 semaines !");
        //await updateCMSItem(itemId, idValue, nextDate);
        return;
    }
};

// -----------------------------
// PUBLICATION SUR SITE WEBFLOW
// -----------------------------
const publishSite = async (): Promise<InformationsType | null> => {
    try {
        const response = await fetch(
            `https://api.webflow.com/v2/sites/${process.env.SITE_ID}/publish`,
                {
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
                }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Erreur lors de la publication :", errorData);
            return null;
        }
        const data = await response.json() as InformationsType;
        console.log("Site publié avec succès !");
        return data;
    } catch (err) {
        console.error("Erreur lors de la publication :", err);
        return null;
    }
};

// ---------------
// FETCH CMS DATA
// ---------------
const fetchCMSData = async (): Promise<InformationsType[] | string> => {
    const response = await fetch(
        `https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, 
            {
                headers: {
                    'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
                    'accept-version': '2.0.0'
                }
            }
    );
    const data = await response.json() as DataType;
    // console.log("data", data);



    try {
        if (data.items && data.items.length > 0) {
            data.items.forEach((item: ItemsType) => {
                //console.log(item.fieldData);
                const date: string = item.fieldData.date;
                const semaine: string = item.fieldData.semaine;
                const cours: string = item.fieldData.cours;
                const itemId: string = item.id;
                const idValue: number = Number(item.fieldData["id-value"]);
                if (idValue && semaine && date && cours) {
                    informations.push({ itemId, idValue, semaine, date, cours });
                }
            });
        }
    } catch (err) {
        console.log("Erreur avec data.items", err);
    }
    // Fixe la date du jour
    const now: Date = new Date();
    /*
        test la date du jour avec 08:00 (il faut supprimer pour la version finale)!!!
    */
    now.setHours(8, 0, 0, 0);
    const formattedDate: string = `${String(now.getDate()).padStart(2, "0")}/` +
                        `${String(now.getMonth() + 1).padStart(2, "0")}/` +
                        `${String(now.getFullYear())}` +
                        ` ${String(now.getHours()).padStart(2, "0")}:` + 
                        `${String(now.getMinutes()).padStart(2, "0")}`;
    console.log("*** formattedDate ***", formattedDate);
    /*
        Vérifie si la date du jour correspond à la date 
        du dernier UPDATE programmé (JSON file)!
    */
    const lastDateRecorded: string | undefined = dateToUpdate.at(-1);
    console.log("** lastDateRecorded **", lastDateRecorded);
    console.log("formattedDate", formattedDate);
    
    if (lastDateRecorded === formattedDate) {
        try {
            //Ordonne la sortie des data par id_value ASC
            informations.sort((a, b) => a.idValue - b.idValue);
            //console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 36; idValueToUpdate++) {
                const item: InformationsType | undefined = informations.find((
                    info: InformationsType) => 
                        info.idValue === idValueToUpdate
                );
                if (item) {
                    await handleIdValue(
                        item.itemId, 
                        item.idValue, 
                        item.date, 
                        item.semaine, 
                        item.cours
                    )
                };
            };
        } catch (err) {
            console.log("Erreur lors avec informations.sort() et informations.forEach()", err);
        }
        //await publishSite();
        return informations;
    } else {
        console.log("Nothing to update !", formattedDate);
        return formattedDate;
    }
};

/* 
    Fonction cron qui sert à lancer la function fetchCMSData();
    Le lancement est programmé pour chaque vendredi à 08:00 ("* 8 * * 5")
*/
cron.schedule("56 16 * * 3", async () => {
    const now = new Date();
    console.log("------ Cron Job lancé ------");
    console.log(`Date et heure actuelles : ${now.toLocaleString()}`);
    console.log("fetchCMSData() va s'exécuter maintenant !");
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    } catch (err) {
        console.error("Erreur lors de fetchCMSData :", err);
    }
    console.log("---------------------------");
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
