# EveilHub API

L'API récupère les dates de la CMS Collection, une fois que les dates sont MAJ, elle les retournent à la CMS Collection.

Les dates sont MAJ à la 8ème semaine de cours, le vendredi à 08:00, grâce au fichier `update-dates.json`, excepté en 
début d'année (voir ci-dessous).

- Update des dates en début d'année

Au début de chaque année, lors du vendredi de la première semaine de l'année, si le vendredi correspond au vendredi de 
la première semaine de l'année, le code s'exécute et la génération automatique des dates pour les 8 première semaines 
de l'année a lieu. Une nouvelle date de MAJ est écrite dans le fichier `update-dates.json` pour que le update se fasse 
le vendredi de la 8ème semaine.

- Update des dates pour le restant de l'année

Ensuite, la MAJ des dates est à nouveau gérée grâce au fichier `update-dates.json`, chaque vendredi de la 8ème semaine
et une nouvelle date de MAJ est écrite dans ce même fichier (`update-dates.json`).


---

## Update Process 

Les updates se font grâce à `node-cron`, au fichier `update-dates.json`, et aux fonctions asynchrones de l'API.

`node-cron` se délenche tous les vendredi à 08:00.

`cron.schedule("0 8 * * 5", async () => {})`.

Les dates sont MAJ toutes les 8 semaines le vendredi à 08:00, excepté le vendredi de la première semaine de l'année. 
Seul ce vendredi peut générer des nouvelles dates pour les 8 premières semaines de cours de l'année.

`const moisActuel: number = aujourdHui.getMonth();`

Si `moisActuel === 0`, alors nous sommes en janvier et qu'il 
faut générer des nouvelles dates, plutôt que de reprendre les anciennes de la CMS Collection pour les actualiser.
(0 = janvier en JavaScript).

Si `moisActuel > 0`, alors la MAJ des dates se fait toutes les 8 semaines de cours, le vendredi. 

Durant les 2 dernières semaines de l'année, qui sont des semaines de vacances, les dates sont notées sous la forme 
de `"--/--/----"`, jusqu'à la 8ème semaine (puisque des nouvelles dates seront générées à partir du vendredi de la 
première semaine de l'année).

---

## En cas de problèmes !!!

// --- À retirer en version finale ---
Décommenter
// now.setHours(8, 0, 0, 0);
// --- --------------------------- ---

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

`pnpm run build`

`pnpm run start`

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

6) Dans la console ou terminal : 

## Lancement

- Installation

`git clone https://github.com/EveilHub/eveil-update-courses.git`

`cd eveil-update-courses`

`pnpm install`

- Mode PRODUCTION ou DEV

`npx tsc`

`pnpm run build`

`pnpm run start`

## CMD pour lancer l'API

`npx tsc`

`pnpm run build`

`pnpm run start`

---

## Sécurité

Malgré qu'aucune donnée sensible ne soit partagée, il y quand même une sécurité pensée.

- TypeScript => fichier `types.ts` contient tous les types de l'API.

Typage pour éviter les erreurs et buggs.

- Gestion des erreurs => try - catch - throw Error - console.error()

Avec les fonction asynchrones en JavaScript moderne.

- Fichier `.env` qui contient toutes les données pour les connexions.

Le fichier `.env` contient toutes les data servant aux connexions (port et propriétés) avec la CMS Collection. Ce 
fichier est caché sur github grâce au fichier `.gitignore` par mesure de sécurité.

- HTTPS pour les connexions

Pas besoins de https, car ce n'est pas un site web, mais une API. Aussi ce n'est pas accessible par un utilisateur
sur un nom de domaine ou par interface ou navigateur (pas d'interractions).

- Particularités

```
  id-value correspond à l'id_value de la CMS Collection.
  Webflow le converti en id-value automatiquement !
  C'est parfait pour la sécurité !!!
  Il faut utiliser Number(item.fieldData["id-value"]), 
  dans ce cas !
```

Si le server serait exposer au frontend, il faudrait utiliser les CORS !
Mais puisque les utilisateurs n'ont pas accès, on en n'a pas besoin.

```
//accepter les ressources pour afficher des data sur page de webflow
app.use((req: Request, res: Response, next: NextType) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); 
  res.setHeader("Access-Control-Allow-Methods", "GET,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
```
