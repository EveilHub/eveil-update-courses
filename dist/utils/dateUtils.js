"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCourseDates = exports.deuxDernieresSemaines = exports.parseDate = exports.formatUpdateFriday = exports.functionDate = void 0;
// + 63j ou 56j après la date figurant dans la cms collection (9 semaines après)
const functionDate = (date) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + 56);
    const nextDates = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()
    ].join("/");
    return nextDates;
};
exports.functionDate = functionDate;
/*
    Update du vendredi avant la semaine 1
    pour le vendredi de la 8ème semaine.
*/
const formatUpdateFriday = (update) => {
    // Ajouter 56 jours et 8 heures
    const newDate = new Date(update);
    newDate.setDate(newDate.getDate() + 56);
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
const formatDate = (date) => {
    return date.toLocaleDateString("fr-FR");
};
const deuxDernieresSemaines = (annee) => {
    // Dernier jour de l'année : 31 décembre
    let fin = new Date(annee, 11, 31);
    // Trouver le lundi de la dernière semaine (lundi = 1, mais JS : lundi = 1 modulo)
    let dernierLundi = new Date(fin);
    dernierLundi.setDate(fin.getDate() - ((fin.getDay() + 6) % 7));
    // Lundi de l'avant-dernière semaine
    let avantDernierLundi = new Date(dernierLundi);
    avantDernierLundi.setDate(dernierLundi.getDate() - 7);
    // Calcul des mardis
    let avantDernierMardi = new Date(avantDernierLundi);
    avantDernierMardi.setDate(avantDernierLundi.getDate() + 1);
    // Calcul des mercredi
    let avantDernierMercredi = new Date(avantDernierLundi);
    avantDernierMercredi.setDate(avantDernierLundi.getDate() + 2);
    // Calcul des jeudis
    let avantDernierJeudi = new Date(avantDernierLundi);
    avantDernierJeudi.setDate(avantDernierLundi.getDate() + 3);
    // Calcul des mardis
    let dernierMardi = new Date(dernierLundi);
    dernierMardi.setDate(dernierLundi.getDate() + 1);
    // Calcul des mercredi
    let dernierMercredi = new Date(dernierLundi);
    dernierMercredi.setDate(dernierLundi.getDate() + 2);
    // Calcul des jeudis
    let dernierJeudi = new Date(dernierLundi);
    dernierJeudi.setDate(dernierLundi.getDate() + 3);
    let dernierVendredi = new Date(dernierLundi);
    dernierVendredi.setDate(dernierLundi.getDate() + 4); // Vendredi (4 jours après lundi)
    return {
        avantDerniereSemaine: {
            lundi: formatDate(avantDernierLundi),
            mardi: formatDate(avantDernierMardi),
            mercredi: formatDate(avantDernierMercredi),
            jeudi: formatDate(avantDernierJeudi),
        },
        derniereSemaine: {
            lundi: formatDate(dernierLundi),
            mardi: formatDate(dernierMardi),
            mercredi: formatDate(dernierMercredi),
            jeudi: formatDate(dernierJeudi),
            vendredi: formatDate(dernierVendredi),
        }
    };
};
exports.deuxDernieresSemaines = deuxDernieresSemaines;
/*
    Génère des dates pour les 8 première semaines,
    chaque nouvelle année après la première semaine
    du nouvel an.
*/
const generateCourseDates = (year) => {
    // Fonction pour obtenir le premier lundi de l'année donnée
    function getFirstMondayOfYear(year) {
        let date = new Date(year, 0, 1); // 1er janvier de l'année donnée
        // Cherche le premier lundi de l'année
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1); // Incrémenter jusqu'à trouver un lundi
        }
        return date;
    }
    // Fonction pour formater la date au format "jj/mm/aaaa"
    const formatDateGenerated = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0 en JavaScript
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };
    let startDate = getFirstMondayOfYear(year); // Obtenez le premier lundi après le Nouvel An
    let courses = [];
    // Générer les dates pour 8 semaines
    for (let week = 0; week < 8; week++) {
        let weekStartDate = new Date(startDate); // Cloner la date du premier lundi
        weekStartDate.setDate(startDate.getDate() + (week * 7)); // Ajouter 7 jours pour chaque nouvelle semaine
        // Lundi : 3 cours à la même date (3x)
        let mondayCourseDate = new Date(weekStartDate);
        for (let i = 0; i < 3; i++) {
            courses.push({ day: 'Lundi', date: formatDateGenerated(mondayCourseDate) });
        }
        // Mardi : 2 cours à la même date (2x)
        let tuesdayCourseDate = new Date(weekStartDate);
        tuesdayCourseDate.setDate(weekStartDate.getDate() + 1); // Mardi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Mardi', date: formatDateGenerated(tuesdayCourseDate) });
        }
        // Mercredi : 2 cours à la même date (2x)
        let wednesdayCourseDate = new Date(weekStartDate);
        wednesdayCourseDate.setDate(weekStartDate.getDate() + 2); // Mercredi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Mercredi', date: formatDateGenerated(wednesdayCourseDate) });
        }
        // Jeudi : 2 cours à la même date (2x)
        let thursdayCourseDate = new Date(weekStartDate);
        thursdayCourseDate.setDate(weekStartDate.getDate() + 3); // Jeudi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Jeudi', date: formatDateGenerated(thursdayCourseDate) });
        }
    }
    return courses;
};
exports.generateCourseDates = generateCourseDates;
