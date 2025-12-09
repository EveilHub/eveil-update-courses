# Eveil API

L'API récupère les dates de la CMS Collection et les renvois à la CMS Collection, une fois que les dates sont update.

Les dates sont updated chaque semaine 8, le vendredi à 08:00, grâce au fichier `update-dates.json` dans lequel sont 
écrits les dates de MAJ (Mise à Jour).

- Update des dates en début d'année

Au début de chaque année, lors du vendredi de la première semaine de l'année, si le vendredi correspond au vendredi de 
la première semaine de l'année, le code s'exécute et la génération automatique des dates pour les 8 première semaines 
de l'année a lieu. Une nouvelle date de MAJ est écrite dans le fichier `update-dates.json` pour que le update se fasse 
le vendredi de la 8ème semaine.

- Update des dates pour le restant de l'année

Ensuite, la MAJ des dates est à nouveau gérée grâce au fichier `update-dates.json`, chaque vendredi de la 8ème semaine
et une nouvelle date de MAJ est écrite dans ce même fichier.

Tout ce dont quoi l'API a besoin pour se connecter à la CMS Collection, se trouve dans le fichier `.env`

---

## Update 

Les updates se font grâce à `node-cron`, au fichier `update-dates.json`, et au code.

node-cron se délenche tous les vendredi à 08:00 

`cron.schedule("* 8 * * 5", async () => {})`.

Les dates sont MAJ en fonction du vendredi (dernier vendredi de la 2ème semaines de vacance ou vendredi de la première 
semaine de l'année) mois de l'année et du mois dans l'année. 

`const moisActuel: number = aujourdHui.getMonth();`

Si `moisActuel === 0`, alors nous sommes en janvier et qu'il 
faut générer des nouvelles dates, plutôt que de reprendre les anciennes de la CMS Collection pour les actualiser.
(0 = janvier en JavaScript).

Si `moisActuel > 0`, alors la MAJ des dates se fait toutes les 8 semaines de cours, le vendredi. 

Durant les 2 dernières semaines de l'année, qui sont des semaines de vacances, les dates sont notées sous la forme de 
`"--/--/----"` peut importe la semaine sur laquelle ça tombe, ça ne change rien.

---

## En cas de problèmes

Aller dans la fonction handleIdValue() :
```
const handleIdValue = async () => {
  ...
  Commenté
  const currentYear: number = new Date().getFullYear();

  Et décommenté en adaptant à l'année souhaitée
  // const currentYear: number = 2026;

  Commenté
  const moisActuel: number = aujourdHui.getMonth();
  
  Et décommenté
  // const moisActuel: number = 0;
  ...
}
```
2) Mettre la date du jour dans `update-dates.json`.

3) décommenté //fetchCMSData(); (node-cron ne se lancera pas !)

4) Dans la console, lancé les CMS suivantes : 

`npx tsc`

`pnpm run dev`

5) Ensuite, effacer la dernière date écrite dans : `update-dates.json`.
```
const handleIdValue = async () => {
  ...
  Décommenté
  // const currentYear: number = new Date().getFullYear();

  Et commenté en adaptant à l'année souhaitée
  const currentYear: number = 2026;

  Décommenté
  // const moisActuel: number = aujourdHui.getMonth();
  
  Et Commenté
  const moisActuel: number = 0;
  ...
}
```

6) Dans la console, lancé les CMS suivantes : 

`npx tsc`

`pnpm run dev`

Vous pourrez voir les dates s'afficher dans la console.

---

## Attention

- Enlever `now.setHours(8, 0, 0, 0);` sinon, ça sera la date du jour avec 08:00 sur 24 heures... !!! 
Utilisable pour les tests.

- Vérifier si `cron.schedule("* 8 * * 5", async () => {})` pour que ça se déclenche tous les vendredi à 8h00.

- Pour 8 semaines `idValueToUpdate <= 72` : `for (let idValueToUpdate = 1; idValueToUpdate <= 72; idValueToUpdate++)`

---

## CMD pour lancer l'API

`npx tsc`

`pnpm run dev`

## Lancement

- Install

`pnpm install`

- Mode BUILD

`node dist/server.js`

- Mode DEV

`npx tsc`

`pnpm run dev`

Affichage dans la console ou terminal.

---

## Sécurité

Malgré qu'aucune donnée sensible ne soit partagée, il y quand même une sécurité pensée.

- TypeScript => fichier `types.ts` contient tous les types de l'API.
- Gestion des erreurs => try - catch - console.error()
- Fichier `.env` qui contient toutes les données pour les connexions.

```
  id-value correspond à l'id_value de la CMS Collection.
  Webflow le converti en id-value automatiquement !
  C'est parfait pour la sécurité !!!
  Il faut utiliser Number(item.fieldData["id-value"]), 
  dans ce cas !
```

Si le server serait exposer au frontend, il faudrait utiliser les CORS !
Mais puisque les utilisateurs n'auront pas accès, on en n'a pas besoin.

```
//accepter les ressources pour afficher des data sur page de webflow
app.use((req: Request, res: Response, next: NextType) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
```

---

## Mes aides
```
// ---------------------------------
// 2. PUBLISH SITE V1 (pages + CMS)
// ---------------------------------
await fetch(
  `https://api.webflow.com/v2/sites/${SITE_ID}/publish`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_TOKEN}`,
      "Content-Type": "application/json"
    },
      body: JSON.stringify({
        live: true
    }),
  }
);
```
`https://developers.webflow.com/data/docs/working-with-the-cms/manage-collections-and-items#defining-reference-and-multi-reference-fields`

### API v2 PUBLISH
```
curl -X POST https://api.webflow.com/v2/sites/580e63e98c9a982ac9b8b741/publish \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{
  "customDomains": [
    "660c6449dd97ebc7346ac629",
    "660c6449dd97ebc7346ac62f"
  ],
  "publishToWebflowSubdomain": false
}'
```

---

## Hébergement

`Render.com` est le meilleur choix gratuit et stable.

✔ la configuration Render "clé en main"

✔ un fichier render.yaml (déploiement automatique)

✔ un fichier spécial cron-runner.js

✔ un Dockerfile (pour Fly.io)

✔ une version optimisée pour hébergement gratuit (sans risques de crash)

---

## TEST

Nb de jours après update:
- update du friday nouvel an (1ère semaine) - done !!!
- update du friday normal (1ère semaine) - done !!!
- jours cms collection - done !!!

- erreur

`update-dates.json` :
- vendredi suivant la génération de date - done !!!
- date suivante placée avant - done !!!
- test avec nouvelle année (générer de nouvelles dates) - done !!!
- test du - ??? !!!
- 


## Console.log()

console.log("*** lastFridayJsonRecorded ***", lastFridayJsonRecorded);
console.log("*** formattedDateHoursMin ***", formattedDateHoursMin);
console.log("*** formattedDate ***", formattedDate);
