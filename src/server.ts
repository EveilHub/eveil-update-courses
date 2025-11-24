require('dotenv').config();
//const express = require('express');
import express, { Request, Response } from 'express';
//import { Request, Response } from 'express'; 
//const fs = require('fs');
//import csv = require('csv-parser');
//const path = require('path');

// interface CourseData {
//     'Numéros de la semaine': string;
//     'Numéros du cours': string;
//     'Dates': string;
// }

const app = express();
const PORT: number = 3000;
//const { Request, Response } = require('express');

const fetchCMSData = async (): Promise<any> => {
    const response = await fetch(`https://api.webflow.com/v2/collections/${process.env.COLLECTION_ID}/items?offset=0&limit=100`, {
        headers: {
            'Authorization': `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
            'accept-version': '2.0.0'
        }
    });

    const data = await response.json();
    console.log("data", data);
    const informations: { date: string; semaine: string; id: string }[] = [];

    if (data.items && data.items.length > 0) {
        data.items.forEach((item: any) => {

            const date = item.fieldData.date;
            const semaine = item.fieldData.semaine;
            const id = item._id || item.id;
            console.log("fieldData:", item.fieldData);
            if (id && semaine && date) {
                informations.push({id, semaine, date});
            }
        });
    }
    
    // Log des intervenants ou tu peux les retourner
    console.log("informations:", informations);
    return informations;

    // if (data.items && data.items.length > 0) {
    //     data.items.forEach((item: any) => {
    //         console.log("fieldData:", item.fieldData);
    //         if (item.fieldData.length > 0) {
    //             item.fieldData.forEach((field: any) => {
    //                 console.log("Propriété:", field); //field.semaine, field.cours, etc...
    //             });
    //         }
    //     });
    // }
};
fetchCMSData();


// app.get('/data', async (req: Request, res: Response): Promise<void> => {
//     try {
//         const data = await fetchCMSData();
//         res.json(data);
//     } catch (error) {
//         res.status(500).send('Erreur lors de la récupération des données');
//     }
// });

//---

// let courses: CourseData[] = [];

// const readCsv = (filePath: string): void => {
//     fs.createReadStream(filePath)
//         .pipe(csv())
//         .on('data', (row: CourseData) => {
//             courses.push(row);
//         })
//         .on('end', () => {
//             console.log('Fichier CSV chargé avec succès.');
//         });
// };

// readCsv(path.join(__dirname, './cours.csv'));

//---

// // Servir les fichiers statiques depuis le dossier dist
// app.use(express.static(path.join(__dirname, '../dist')));

// app.get('/data', (req: Request, res: Response) => {
//     res.json(courses);
// });

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur http://localhost:${PORT}`);
});
