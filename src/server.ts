import 'dotenv/config';
import cron from 'node-cron';
import express, { Request, Response } from "express";
import { Redis } from '@upstash/redis';
import { 
    parseDate,
    functionDate,
    formatUpdateFriday,
    deuxDernieresSemaines,
    generateCourseDates 
} from "./utils/dateUtils";
import type { 
    DataType, 
    ItemsType, 
    InformationsType, 
    EndDatesYearsTypes, 
    FetchCMSDataResult,
    WebflowPublishResponse 
} from "./types/types";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Stock les data
let informations: InformationsType[] = [];

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ----------------------------------------
// Charger - Ajouter les dates depuis Redis
// ----------------------------------------
const addDate = async (date: string): Promise<void> => {
    const raw = await redis.get('update_dates');
    if (typeof raw !== 'string') {
        const dates: Record<string, string> = { "0": date };
        await redis.set('update_dates', JSON.stringify(dates));
        return;
    }
    const dates = JSON.parse(raw) as Record<string, string>;
    if (dates["0"] === date) return;
    dates["0"] = date;
    await redis.set('update_dates', JSON.stringify(dates));
};

const getLastDate = async (): Promise<string | null> => {
    const raw = await redis.get("update_dates");
    if (!raw) return null;
    if (typeof raw === "object" && raw !== null) {
        return (raw as Record<string, string>)["0"] ?? null;
    }
    if (typeof raw === "string") {
        try {
            const dates = JSON.parse(raw) as Record<string, string>;
            return dates["0"] ?? null;
        } catch (err) {
            console.error("Erreur JSON.parse:", err, raw);
            return null;
        }
    }
    return null;
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
            throw new Error(`Update échoué: ${JSON.stringify(errorData)}`);
        }
        console.log(`Cours ${itemId} mis à jour avec succès:`, nouvelleDate);
    } catch (err) {
        console.error("Erreur lors du PATCH :", err);
        throw err;
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
    cours: string,
    formattedDate: string
): Promise<void> => {

    // Formatage des dates
    const formatData: Date = parseDate(date);
    const formatDateAujourdHui: Date = parseDate(formattedDate);

    // Date générée avec +63 jours
    let nextDate: string = functionDate(formatData);
    // Si les dates de nextDate tombent sur les vacances
    const noDates: string = "--/--/----";
    // Update le vendredi de la 8ème semaine, à 08:00
    const update: string = formatUpdateFriday(formatDateAujourdHui);

    /*
        Génère des dates pour les 8ère semaines de l'année
        pour n'importe quelle année, à partir du vendredi
        de la semaine du nouvel an. Soit 1 semaine avant
        la génération des dates pour les 8 semaines.
    */
    const currentYear: number = new Date().getFullYear();
    let coursesForStartYear: {day: string, date: string}[] = generateCourseDates(currentYear);

    /*
        Calcul des 2 dernières semaines de l'année en cours.
        La 1ère comprend Noël et la seconde comprend nouvel an.
    */
    const lastWeeksPerYear: EndDatesYearsTypes = deuxDernieresSemaines(currentYear);
    const holidays = Object.values(lastWeeksPerYear).flatMap((week) => Object.values(week));
    const verifyHolidays: boolean = holidays.includes(nextDate);
    
    const aujourdHui: Date = new Date();
    const moisActuel: number = aujourdHui.getMonth();

    if ((moisActuel === 0) && (idValue === 1)) {
        await redis.set("update_dates", JSON.stringify({}));
        await addDate(update);
    } else if ((moisActuel !== 0) && (idValue === 1)) {
        await addDate(update);
    } else {
        console.log("No item to update !");
    };

    if (moisActuel > 0) {
        if (verifyHolidays) {
            // Génère "--/--/----" pour les jours restants pour les 8 semaines
            const currentIndex = informations.findIndex((info: { idValue: number; }) => 
                info.idValue === idValue
            );
            if (currentIndex !== -1) {
                for (let i = currentIndex; i < informations.length; i++) {
                    const nextItem = informations[i];
                    console.log("!!! Ces dates tombent sur la 1ère semaine vacances !!!",
                        nextItem.itemId, nextItem.idValue, noDates);
                    await updateCMSItem(nextItem.itemId, nextItem.idValue, noDates);
                    return;
                }
                return;
            }
        } else {
            console.log(`2) MAJ du CMS par idValue ${idValue}: ${nextDate}`, "correspondant à",
              `Semaine ${semaine}`, cours);
            await updateCMSItem(itemId, idValue, nextDate);
        }
    } else if (moisActuel === 0) {
        // Génère les dates pour les 8 première semaines de l'année
        const secondIndex = informations.findIndex((info: { idValue: number; }) => 
            info.idValue === idValue
        );
        if (secondIndex !== -1) {
            for (let i = secondIndex; i < informations.length; i++) {
                const nextItem_2 = informations[i];
                let course = coursesForStartYear[i];
                console.log(nextItem_2.itemId, nextItem_2.idValue, `Date of courses: ${course.date}`);
                await updateCMSItem(nextItem_2.itemId, nextItem_2.idValue, course.date);
                return;
            };
            return;
        }
    } else {
        console.log("Error: something went wrong with month !!!");
    };
};

// -----------------------------
// PUBLICATION SUR SITE WEBFLOW
// -----------------------------
const publishSite = async (): Promise<WebflowPublishResponse> => {
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
            throw new Error("Publication échouée...");
        }
        const data: WebflowPublishResponse = await response.json();
        console.log("Site publié avec succès !");
        return data;
    } catch (err) {
        console.error("Erreur lors de la publication :", err);
        throw err;
    }
};

// ---------------
// FETCH CMS DATA
// ---------------
const fetchCMSData = async (): Promise<FetchCMSDataResult> => {
    informations = [];

    try {
        const response = await fetch(
            `https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`,
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
                        'accept-version': '2.0.0'
                    }
                }
        );

        if (!response.ok) {
            throw new Error(`Webflow API error: ${response.status}`);
        }

        const data = await response.json() as DataType;
        // console.log("data", data);

        if (data.items && data.items.length > 0) {
            data.items.forEach((item: ItemsType) => {
                //console.log(item.fieldData);
                const date: string = item.fieldData.date;
                const semaine: string = item.fieldData.semaine;
                const cours: string = item.fieldData.cours;
                const itemId: string = item.id;
                const idValue: number = Number(item.fieldData["id-value"]);
                if (!isNaN(idValue) && semaine && date && cours) {
                    informations.push({ itemId, idValue, semaine, date, cours });
                }
            });
        }
    } catch (err: any) {
        console.error("Erreur lors de la récupération des données Webflow :", err);
        return { updated: false, message: `Erreur: ${err.message || err}` };
    }

    // Fixe la date du jour
    const now: Date = new Date();

    // Fn() qui sert à formatter les dates pour ci-dessous
    const pad = (n: number) => String(n).padStart(2, "0");

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
    const lastFridayJsonRecorded: string | null = await getLastDate();

    // Instancie le 1er vendredi de l'année qui tombe sur la semaine du nouvel an
    const currentYear: number = new Date().getFullYear();
    const lastWeeksPerYear: EndDatesYearsTypes = deuxDernieresSemaines(currentYear);
    const secondFridayHoliday: string = lastWeeksPerYear.derniereSemaine.vendredi;

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
                        item.cours,
                        formattedDate
                    )
                };
            };
            await publishSite();
            return { updated: true, message: "Mises à jour effectuées avec succès." };
        } catch (err: any) {
            console.error("Erreur lors du traitement des informations :", err);
            return { updated: false, message: `Erreur lors du traitement: ${err.message || err}` };
        }
    } else {
        console.log("Nothing to update !", formattedDateHoursMin);
        return { updated: false, message: "Rien à mettre à jour aujourd'hui." };
    }
};

/*
    Lancement de la fonction fetchCMSData() programmé pour 
    chaque vendredi à 08:00 UTC ("0 7 * * 5")
*/
cron.schedule("0 7 * * 5", async (): Promise<void> => {
    const today: Date = new Date();
    const dateUTC = today.toLocaleDateString("fr-FR", { 
        timeZone: "UTC",
    });
    console.log("------ Cron Job lancé ------");
    console.log(`Date UTC : ${dateUTC}`);
    try {
        await fetchCMSData();
        console.log("fetchCMSData() terminé avec succès !");
    } catch (err) {
        console.error("Erreur lors de fetchCMSData() :", err);
    }
        console.log("---------------------------");
    },
    {
        timezone: "UTC",
    }
);

app.get("/healthz", (req, res) => res.status(200).send("OK"));

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur en cours d'exécution sur le PORT: ${PORT}`);
});