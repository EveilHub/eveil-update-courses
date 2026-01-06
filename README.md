# EveilHub API

L'API récupère l'ensemble des data de la CMS Collection de Webflow. Ensuite, les dates sont traitées par l'API pour les
MAJ. Une fois que les dates sont MAJ, l'API les retournent à la CMS Collection.

Les dates sont MAJ lors de la 8ème semaine de cours, le vendredi à 08:00, grâce au fichier `update-dates.json`, excepté 
en début d'année (voir ci-dessous).

- MAJ des dates en début d'année

Au début de chaque année, si le vendredi correspond au vendredi de la première semaine de l'année, le code s'exécute et la 
génération automatique des dates, pour les 8 première semaines, a lieu. Toutes les précédentes dates servant de MAJ dans le 
fichier `update-dates.json` sont écrasées et la date pour la prochaine MAJ est inscrite dans ce même fichier 
(`update-dates.json` ) pour que la MAJ se fasse le vendredi de la 8ème semaine.

- MAJ des dates pour le restant de l'année

Ensuite, la MAJ des dates est gérée grâce au fichier `update-dates.json`, chaque vendredi de la 8ème semaine et une 
nouvelle date de référence pour la prochaine MAJ est écrite dans ce même fichier (`update-dates.json`).

---

## Update Process (MAJ)

Les MAJ se font grâce à `node-cron`, au fichier `update-dates.json`, au fichier `dateUtils.js`, et aux fonctions 
asynchrones de l'API qui se trouvent dans le fichier `server.js`.

`node-cron` se délenche tous les vendredi à 08:00.

`cron.schedule("0 8 * * 5", async () => {})`.

Les dates sont MAJ lors de la 8ème semaines des cours, le vendredi à 08:00. Seul le vendredi, de la première semaine, a 
la particularité de générer des nouvelles dates pour les 8 premières semaines de cours de l'année.

`const moisActuel: number = aujourdHui.getMonth();`

Si `moisActuel === 0`, alors nous sommes en janvier (0 = janvier en JavaScript) et il faut générer des nouvelles dates, 
plutôt que de reprendre les anciennes de la CMS Collection pour les actualiser.

Si `moisActuel > 0`, alors la MAJ des dates se fait toutes les 8 semaines de cours, le vendredi. 

Durant les 2 dernières semaines de l'année, qui sont des semaines de vacances, les dates sont notées sous la forme 
de `"--/--/----"`, jusqu'à la 8ème semaine (puisque des nouvelles dates seront générées à partir du vendredi de la 
première semaine de l'année).

---

## Configuration

nodejs v24.12.0

pnpm 10.27.0

Voir les versions :

`node -v`

`pnpm -v`

Update avec nodejs :

`nvm list`

`nvm install --lts`

`nvm use --lts`

`nvm uninstall vXX.XX.XX`

Update de pnpm :

`pnpm self-update`

Pour le reste, c'est dans le fichier `package.json` que ça se passe.

les fichiers `.node-version` et `.nvmrc` sont des fichiers de configuration pour server. Je voulais utiliser Render, 
mais j'ai abandonné l'idée (payant pour node-cron). C'est pourquoi j'ai laissé ces fichiers au besoin.

Le fichier `.gitignore` sert à planquer le fichier `.env`.

Le fichier `.env` contient toutes les data servant aux connexions (port et propriétés) avec la CMS Collection.

Le dossier `src` comprends les fichiers au format `.ts` qui sont les fichiers comprenant le code original. Lorsque 
l'usr lance la CMD `pnpm build` la compilation de ce code donne pour résultat les fichiers au format `.js` se 
trouvant dans le dossier `dist`.

---

## En cas de problèmes !!!

`!!! Les modifications se font dans les fichiers.ts en non .js !!!`

Car les modifications prendront effet après compilation du TypeScript en JavaScript grâce à la CMD :

`pnpm build`

1) Dans la fonction `fetchCMSData()` :

```
//const formattedDate: string = `${day}/${month}/${year}`;
const formattedDate: string = `02/01/2026`; // Date du jour
...

//const formattedDateHoursMin: string = `${formattedDate} ${hours}:${minutes}`;
const formattedDateHoursMin: string = `02/01/2026 08:00`; // Même date que dans le fichier `update-dates.json`;
...

//const secondFridayHoliday: string = lastWeeksPerYear.derniereSemaine.vendredi;
const secondFridayHoliday: string = `02/01/2026`;
...

```

2) Configurer `node-cron` pour qu'il se déclenche toutes les 2 minutes :

`cron.schedule("*/2 * * * *", async (): Promise<void> => {})`

Valeur initiale : `cron.schedule("0 8 * * 5", async (): Promise<void> => {})`;

3) Mettre la date du jour manuellement dans `update-dates.json`.

4) Dans la console, lancé les CMD suivantes : 

`npx tsc`

`pnpm build`

`pnpm start`

5) Ensuite, effacer la dernière date écrite dans : `update-dates.json`.

6) Dans la fonction handleIdValue() :

`const moisActuel: number = 0;`

Il est possible que le mois `0` pose problème, principalement au mois de janvier.
En effet, la MAJ se faisant qu'une seule fois durant ce mois, il se peut qu'en utilisant l'API en mode DEV,
au mois de janvier, la condition :

```
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
    }
```

pose problème, puisqu'elle sert à générer des nouvelles dates. A chanque lancement de l'API au mois de 
janvier, les dates générées seront toujours les mêmes !!!

Il suffit de modifier la valeur, par exemple:

`const moisActuel: number = 2;`

## Installation

`git clone https://github.com/EveilHub/eveil-update-courses.git`

`cd eveil-update-courses`

`pnpm install`

## CMD pour lancer l'API

- En mode PROD :

Utiliser `npx` permet d'éviter les problèmes liés à des versions différentes de TypeScript installées 
globalement et localement. Recommandé pour éviter les problèmes de version et garantir que le projet 
utilise la bonne version du compilateur TypeScript.

`npx tsc`

Compilation des fichiers TypeScript en JavaScript :

`pnpm build`

Lancement de l'API :

`pnpm start`

- En mode DEV (avec nodemon pas besoin de restart le server) :

`npx tsc`

`pnpm dev`

---

## Sécurité

Malgré qu'aucune donnée sensible ne soit partagée, il y quand même une sécurité présente.

- pnpm :

node package manager, mais sans les conflits rencontrés avec npm.

- TypeScript => fichier `types.ts` :

Typage pour éviter les erreurs et buggs.

- Gestion des erreurs => `try - catch (error) - throw new Error() - throw error - console.error()` :

Avec les fonction asynchrones en JavaScript moderne.

- Fichier `.env` :

Ce fichier est caché sur github grâce au fichier `.gitignore` par mesure de sécurité.

- HTTPS pour les connexions :

Pas besoins de https, car ce n'est pas un site web, mais une API. Aussi ce n'est pas accessible par un utilisateur
sur un nom de domaine ou par interface ou navigateur (pas d'interractions).

- Particularités :

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
