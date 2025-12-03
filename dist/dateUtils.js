"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deuxDernieresSemaines = exports.formatHolidayUpdate = exports.parseDate = exports.formatUpdateFriday = exports.functionDate = void 0;
// + 63j après la date figurant dans la cms collection (9 semaines après)
const functionDate = (date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 63);
    const nextDates = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()
    ].join("/");
    return nextDates;
};
exports.functionDate = functionDate;
// Update du vendredi
const formatUpdateFriday = (update) => {
    // Ajouter 54 jours et 8 heures
    const newDate = new Date(update);
    newDate.setDate(newDate.getDate() + 54);
    newDate.setHours(newDate.getHours() + 8);
    // Ajuster pour tomber sur vendredi (5 en JS, 0 = dimanche)
    const dayOfWeek = newDate.getDay(); // 0 = dimanche ... 5 = vendredi
    const daysToFriday = (5 - dayOfWeek + 7) % 7;
    newDate.setDate(newDate.getDate() + daysToFriday);
    const nextDates = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()
    ].join("/");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");
    return `${nextDates} ${hours}:${minutes}`;
};
exports.formatUpdateFriday = formatUpdateFriday;
// Centralize date parsing and handling
const parseDate = (dateStr) => {
    const [dayStr, monthStr, yearStr] = dateStr.split("/");
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    return new Date(year, month - 1, day);
};
exports.parseDate = parseDate;
// Calculer les 2 dernières semaines de l'année
function formatDate(date) {
    return date.toLocaleDateString("fr-FR");
}
;
const formatHolidayUpdate = (date) => {
    // 4 jours avant et 8 heures 
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() - 3);
    newDate.setHours(newDate.getHours() + 8);
    const nextDates = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()
    ].join("/");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");
    return `${nextDates} ${hours}:${minutes}`;
};
exports.formatHolidayUpdate = formatHolidayUpdate;
const deuxDernieresSemaines = (annee) => {
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
exports.deuxDernieresSemaines = deuxDernieresSemaines;
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
