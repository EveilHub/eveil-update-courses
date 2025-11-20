# API

- Merci => pandoc mon_fichier.md -o mon_fichier.html (en console)

---

API Webflow
https://developers.webflow.com/reference

---

## 1) Récupérer les Données du CMS

Utilisez la méthode GET de l'API pour récupérer les entrées du CMS que vous souhaitez 
mettre à jour.
<style>
	pre {
		font-size: 1.0rem;
		background-color: #222;
		color: #00ff00;
	    	padding: 20px 10px;
	    	border-radius: 5px;
	}
</style>

```
const fetchCMSData = async () => {
    const response = await fetch('https://api.webflow.com/collections/{collection_id}/items', {
        headers: {
            'Authorization': 'Bearer {your_access_token}',
            'accept-version': '1.0.0'
        }
    });
    const data = await response.json();
    return data.items; // Retourne les éléments du CMS
};
```
---

## 2) Calculer la Date

Établissez une fonction pour calculer la nouvelle date. Vous pouvez utiliser Date en 
JavaScript pour gérer cela.
```
const calculateNewDates = (currentDate) => {
    const newDates = [];
    for (let i = 1; i <= 8; i++) {
        // Ajoute 56 jours (8 semaines)
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 56);
        newDates.push(newDate.toISOString().split('T')[0]); // Format 'YYYY-MM-DD'
    }
    return newDates;
};
```
---

## 3) Mettre à Jour le CMS

Utilisez la méthode PUT de l'API pour mettre à jour les enregistrements avec les 
nouvelles dates.
```
const updateCMSData = async (itemId, newDate) => {
    await fetch(`https://api.webflow.com/collections/{collection_id}/items/${itemId}`, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer {your_access_token}',
            'Content-Type': 'application/json',
            'accept-version': '1.0.0'
        },
        body: JSON.stringify({
            fields: {
                dateField: newDate // Remplacez `dateField` par le nom réel du champ de date
            }
        })
    });
};
```
---

## 4) Combiner les Étapes

Créez une fonction principale qui exécute l'ensemble du processus : récupérer les 
données, calculer les nouvelles dates et mettre à jour le CMS.
```
const updateDatesInWebflow = async () => {
    const items = await fetchCMSData();
    const newDates = calculateNewDates(new Date());

    for (const item of items) {
        const newDate = newDates.shift(); // Récupère la première nouvelle date
        await updateCMSData(item._id, newDate);
    }
};
```
## 5) Exécution de la mise à jour

updateDatesInWebflow();

Pour automatiser ce script afin qu'il s'exécute toutes les 8 semaines, vous pouvez
utiliser un service cron ou un gestionnaire de tâches (comme Node.js avec node-cron)
si vous hébergez ce script sur un serveur.

---

## Ecrire des données CSV en python3 :

```
import csv

# Données à écrire dans le fichier CSV
donnees = [
    ["Nom du cours", "Date", "Heure", "Durée"],
    ["Mathématiques", "2025-11-20", "09:00", "1h"],
    ["Physique", "2025-11-20", "10:30", "1h"],
    ["Chimie", "2025-11-20", "13:00", "1h"],
    ["Biologie", "2025-11-21", "09:00", "1h"],
    ["Histoire", "2025-11-21", "10:30", "1h"],
    ["Géographie", "2025-11-21", "13:00", "1h"]
]

# Ouvrir ou créer le fichier CSV en mode écriture
with open('cours.csv', mode='w', newline='') as fichier_csv:
    writer = csv.writer(fichier_csv)

    # Écrire les données dans le fichier CSV
    writer.writerows(donnees)

print("Données écrites avec succès dans 'cours.csv'.")
```
Execute with: `python3 votre_script.py`
