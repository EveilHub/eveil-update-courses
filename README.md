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

- Attention à enlever `now.setHours(8, 0, 0, 0);` sinon, ça sera la date du jour avec 08:00 sur 24 heures... !!!

---

## CMD pour lancer l'API

`npx tsc`

`pnpm run dev`

Affichage dans la console ou terminal.

---

## Sécurité

Malgré qu'aucune donnée sensible ne soit partagée, il y quand même une sécurité pensée.

- TypeScript => fichier `types.ts` contient tous les types de l'API.
- Gestion des erreurs => try et catch
- Connection sécurisée HTTPS => ???

```
	id-value correspond à l'id_value de la CMS Collection.
	Webflow le converti automatiquement en "id-value" !
	C'est parfait pour la sécurité !!!
	Il faut utiliser Number(item.fieldData["id-value"]), dans ce cas !
```

Si le server serait exposer au frontend, il faudrait utiliser les CORS !
Mais puisque les utilisateurs n'auront pas accès, il n'a pas besoin des CORS.

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

### leveil.webflow.io
### aeveil.ch
### www.aeveil.ch

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