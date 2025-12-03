# Eveil API

L'API récupère les dates de la CMS Collection et les renvois une fois update à la CMS Collection.

---

## Update 

- Update toutes les dates des cours pour 8 semaines, tous les vendredi de la 8 semaine (54ème jour) à 08:00 heures !
Le code récupère la dernière date de la liste qui se trouve dans le fichier `update-dates.json` et la comparre avec celle du jour et l'heure (08:00).

- Durant les semaines de vacances, les cours ne sont pas notés dans la CMS Collection. Ils sautent une semaine ou + selon comment...
	(!!! demander à Neville et Mattéo pour les dates de vacances et jours fériés !!!)

---

## Attention

- Enlever `now.setHours(8, 0, 0, 0);` sinon, ça sera la date du jour avec 08:00 sur 24 heures... !!!
- Ajouter `cron.schedule("* 8 * * 5", async () => {})` pour que ça se déclenche vendredi à 8h00.

- Pour 3 semaines `idValueToUpdate <= 27` : `for (let idValueToUpdate = 1; idValueToUpdate <= 27; idValueToUpdate++)`

---

## CMD pour lancer l'API

`npx tsc`

`pnpm run dev`

`pnpm run build`

`lancer les server`

`héberger le server gratuitement`

## Lancement

`pnpm install`

`pnpm run build`


`npx tsc`

`node dist/server.js`

Affichage dans la console ou terminal.

---

## Sécurité

Malgré qu'aucune donnée sensible ne soit partagée, il y quand même une sécurité pensée.

- TypeScript => fichier `types.ts` contient tous les types de l'API.
- Gestion des erreurs => try et catch
- Connection sécurisée HTTPS => ???

```
  id-value correspond à l'id_value de la CMS Collection.
  Webflow le converti en id-value automatiquement !
  C'est parfait pour la sécurité !!!
  Il faut utiliser Number(item.fieldData["id-value"]), 
  dans ce cas !
```

Si le server serait exposer au frontend, il faudrait utiliser les CORS !
Mais puisque les utilisateurs n'auront pas accès, il n'a pas besoin.

```
//accepter les ressources pour afficher des data sur page de webflow
app.use((req: Request, res: Response, next: NextType) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
```

## Affichage avec url : 127.0.0.1:3000/data

```
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/data', async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await fetchCMSData() as InformationsType[] | string;
        res.json(data);
    } catch (error) {
        res.status(500).send('Erreur lors de la récupération des données');
    }
});
```

---

### leveil.webflow.io
### aeveil.ch
### www.aeveil.ch

---

```
// FETCH DOMAIN
// const fetchDomains = async () => {
//   const res = await fetch(`https://api.webflow.com/v2/sites/${process.env.SITE_ID}/custom_domains`, {
//     headers: {
//       "Authorization": `Bearer ${process.env.WEBFLOW_API_TOKEN}`,
//       "accept-version": "2.0.0"
//     }
//   });
//   const domains = await res.json() as string;
//   console.log(domains);
// };

// fetchDomains();
```

---

### Resultat

```
{
  customDomains: [
    {
      id: '665f0ab5950e89499f5fc23f',
      url: 'www.aeveil.ch',
      lastPublished: '2025-11-26T15:21:00.973Z'
    },
    {
      id: '665f0ab5950e89499f5fc236',
      url: 'aeveil.ch',
      lastPublished: '2025-11-26T15:21:00.973Z'
    }
  ]
}
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

`https://developers.webflow.com/data/docs/working-with-the-cms/manage-collections-and-items#defining-reference-and-multi-reference-fields`

## API v2 PUBLISH
=================

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

Pour le time :

```
    // const day = String(now.getDate()).padStart(2, "0");
    // const month = String(now.getMonth() + 1).padStart(2, "0");
    // const year = String(now.getFullYear());
    // Fixe l'heure et les minutes
    // const hours = String(now.getHours()).padStart(2, "0");
    // const minutes = String(now.getMinutes()).padStart(2, "0");
    //const formattedDate: string = `${day}/${month}/${year} ${hours}:${minutes}`;
```

---

## Hébergement

`Render.com` est le meilleur choix gratuit et stable.

✔ la configuration Render "clé en main"
✔ un fichier render.yaml (déploiement automatique)
✔ un fichier spécial cron-runner.js
✔ un Dockerfile (pour Fly.io)
✔ une version optimisée pour hébergement gratuit (sans risques de crash)

`tsconfig.json`
```
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "commonjs",
    "target": "es2019",
    "esModuleInterop": true,
    "strict": true
```

Vacances : 22 dec - 04 janv
Les cours reboot à la semaine 1 après les vacances !!!