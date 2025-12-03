import type { EndDatesYearsTypes } from "./types";

// Reusable function to convert date
// + 63j après la date figurant dans la cms collection (9 semaines après)
export const functionDate = (date: Date): string => {
    date.setDate(date.getDate() + 63);
    const nextDates = [
        String(date.getDate()).padStart(2, "0"),
        String(date.getMonth() + 1).padStart(2, "0"),
        date.getFullYear()
    ].join("/");
    return nextDates;
};

export const formatUpdate = (update: Date): string => {
    // Ajouter 54 jours et 8 heures
    update.setDate(update.getDate() + 54);
    update.setHours(update.getHours() + 8);

    // Ajuster pour tomber sur vendredi (5 en JS, 0 = dimanche)
    const dayOfWeek = update.getDay();  // 0 = dimanche ... 5 = vendredi
    const daysToFriday = (5 - dayOfWeek + 7) % 7;
    update.setDate(update.getDate() + daysToFriday);

    // Formater la date
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
export const parseDate = (dateStr: string): Date => {
    const [dayStr, monthStr, yearStr] = dateStr.split("/");
    const day: number = parseInt(dayStr, 10);
    const month: number = parseInt(monthStr, 10);
    const year: number = parseInt(yearStr, 10);
    return new Date(year, month - 1, day);
};

// Calculer les 2 dernières semaines de l'année
function formatDate(date: Date): string {
    return date.toLocaleDateString("fr-FR");
};

export const deuxDernieresSemaines = (annee: number): EndDatesYearsTypes => {
    // Dernier jour de l'année : 31 décembre
    let fin = new Date(annee, 11, 31);

    // Trouver le lundi de la dernière semaine (lundi = 1, mais JS : lundi = 1 modulo)
    let dernierLundi = new Date(fin);
    dernierLundi.setDate(fin.getDate() - ((fin.getDay() + 6) % 7));

    // Lundi de l'avant-dernière semaine
    let avantDernierLundi = new Date(dernierLundi);
    avantDernierLundi.setDate(dernierLundi.getDate() - 7);

    // Calcul des dimanches
    let avantDernierDimanche = new Date(avantDernierLundi);
    avantDernierDimanche.setDate(avantDernierLundi.getDate() + 6);

    let dernierDimanche = new Date(dernierLundi);
    dernierDimanche.setDate(dernierLundi.getDate() + 6);

    return {
        avantDerniereSemaine: {
            debut: formatDate(avantDernierLundi),
            fin: formatDate(avantDernierDimanche),
        },
        derniereSemaine: {
            debut: formatDate(dernierLundi),
            fin: formatDate(dernierDimanche),
        }
    };
};

//console.log(deuxDernieresSemaines(2025));

// const x: number = new Date().getFullYear();
// console.log(deuxDernieresSemaines(x));

/*
2025
{
  "avantDerniereSemaine": {
    "debut": "22/12/2025",
    "fin": "28/12/2025"
  },
  "derniereSemaine": {
    "debut": "29/12/2025",
    "fin": "04/01/2026"
  }
}

2026
{
  "avantDerniereSemaine": {
    "debut": "21/12/2026",
    "fin": "27/12/2026"
  },
  "derniereSemaine": {
    "debut": "28/12/2026",
    "fin": "03/01/2027"
  }
}
*/
