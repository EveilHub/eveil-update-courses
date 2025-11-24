"use strict";
async function fetchData() {
    try {
        const response = await fetch(`https://api.webflow.com/v2/collections/{690b3555323b204fb0ccd305}/items`, {
            method: 'GET', // ou 'POST' selon le besoin
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 7c411607d26a4910ef547747cc20c6e4b1b0ab1c8c985288badac92734a496cc`
            }
        });
        // Vérifiez si la réponse est correcte
        if (!response.ok) {
            throw new Error(`Erreur HTTP : ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        // Traitez vos données ici, par exemple, les afficher sur la page
    }
    catch (error) {
        console.error('Erreur:', error);
    }
}
// Appelez la fonction pour tester
fetchData();
