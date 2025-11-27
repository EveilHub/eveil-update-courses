import type { DataType, ItemsType, InformationsType } from "./types";
import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

const UPDATE_FILE = path.join(__dirname, "update-dates.json");

const app = express();
const PORT: number = 3000;

// Load from JSON file
const loadUpdateDates = (): string[] => {
    try {
        return JSON.parse(fs.readFileSync(UPDATE_FILE, "utf8"));
    } catch {
        return [];
    }
};

let dateToUpdate: string[] = loadUpdateDates();

// Save in JSON file
const saveUpdateDates = (): void => {
    try {
        fs.writeFileSync(UPDATE_FILE, JSON.stringify(dateToUpdate, null, 2), "utf8");
        console.log("File saved successfully!");
    } catch (err) {
        console.error("Erreur lors de la sauvegarde :", err);
    }
};

// Reusable function to convert date
const functionDate = (date: Date): string => {
    date.setDate(date.getDate() + 3);
    const nextDates = [
        String(date.getDate()).padStart(2, "0"),
        String(date.getMonth() + 1).padStart(2, "0"),
        date.getFullYear()
    ].join("/");
    return nextDates;
};

// Update toutes les 8 semaines, le vendredi à 08:00
const formatUpdate = (update: Date): string => {
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
const parseDate = (dateStr: string): Date => {
    const [dayStr, monthStr, yearStr] = dateStr.split("/");
    const day: number = parseInt(dayStr, 10);
    const month: number = parseInt(monthStr, 10);
    const year: number = parseInt(yearStr, 10);
    return new Date(year, month - 1, day);
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
const handleIdValue = async (itemId: string, idValue: number, date: string, semaine: string, cours: string): Promise<void> => {
    const parseData: Date = parseDate(date);
    const update: string = formatUpdate(parseData);
    const nextDates: string = functionDate(parseData);

    const datesPremieresVacances: string[] = ['22/12/2025', '23/12/2025', '24/01/2025', '25/01/2025', 
        '29/01/2025', '30/01/2025', '31/01/2025', '01/01/2026'];
    const datesSecondesVacances: string[] = ['20/01/2026', '21/01/2026', '22/01/2026', '23/01/2026'];

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
    // Il faut un reboot à la semaine 1 après les vacances $(semaine === 1) pour la prochaine date !!!
    console.log(`Mise à jour CMS pour idValue ${idValue}: ${nextDates}`, "correspondant à", `Semaine ${semaine}`, cours);
    await updateCMSItem(itemId, idValue, nextDates);
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
    const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, {
        headers: {
            'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
            'accept-version': '2.0.0'
        }
    });
    const data = await response.json() as DataType;
    // console.log("data", data);

    // Faut-il vraiement le mettre ici !!!
    const informations: InformationsType[] = [];

    try {
        if (data.items && data.items.length > 0) {
            data.items.forEach((item: ItemsType) => {
                //console.log(item.fieldData);
                const date: string = item.fieldData.date;
                const semaine: string = item.fieldData.semaine;
                const cours: string = item.fieldData.cours;
                const itemId: string = item.id;
                const idValue: number = Number(item.fieldData["id-value"]);
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
                        `${String(now.getFullYear())}` + // à vérifier avec String !!!
                        `${String(now.getHours()).padStart(2, "0")}:` +
                        `${String(now.getMinutes()).padStart(2, "0")}`;
    console.log("*** formattedDate ***", formattedDate);
    /*
        Vérifie si la date du jour correspond à la date 
        du dernier UPDATE programmé (JSON file)!
    */
    const lastDateRecorded: string | undefined = dateToUpdate.at(-1);
    console.log("** lastDateRecorded **", lastDateRecorded);
    
    if (lastDateRecorded === formattedDate) {
        try {
            //Ordonne la sortie des data par id_value ASC
            informations.sort((a, b) => a.idValue - b.idValue);
            //console.log("informations:", informations);
            for (let idValueToUpdate = 1; idValueToUpdate <= 27; idValueToUpdate++) {
                const item: InformationsType | undefined = informations.find((info: InformationsType) => info.idValue === idValueToUpdate);
                if (item) {
                    await handleIdValue(item.itemId, item.idValue, item.date, item.semaine, item.cours);
                }
            }
        } catch (err) {
            console.log("Erreur lors avec informations.sort() et informations.forEach()", err);
        }
        await publishSite();
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
cron.schedule("30 14 * * 4", async () => {
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
