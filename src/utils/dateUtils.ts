import type { EndDatesYearsTypes } from "../types/types";

// + 63j ou 56j après la date figurant dans la cms collection (9 semaines après)
export const functionDate = (date: Date): string => {
    const newDate: Date = new Date(date);
    newDate.setDate(newDate.getDate() + 56);

    const nextDates = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()].join("/");
    return nextDates;
};

/* 
    Update du vendredi avant la semaine 1 
    pour le vendredi de la 8ème semaine.
*/
export const formatUpdateFriday = (update: Date): string => {
    // Ajouter 56 jours et 8 heures
    const newDate: Date = new Date(update);
    newDate.setDate(newDate.getDate() + 56);
    newDate.setHours(newDate.getHours() + 8);

    // Ajuster pour tomber sur vendredi (5 en JS, 0 = dimanche)
    const dayOfWeek: number = newDate.getDay();  // 0 = dimanche ... 5 = vendredi
    const daysToFriday: number = (5 - dayOfWeek + 7) % 7;
    newDate.setDate(newDate.getDate() + daysToFriday);

    const nextDates: string = [
        String(newDate.getDate()).padStart(2, "0"),
        String(newDate.getMonth() + 1).padStart(2, "0"),
        newDate.getFullYear()
    ].join("/");
    const hours = String(newDate.getHours()).padStart(2, "0");
    const minutes = String(newDate.getMinutes()).padStart(2, "0");
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
const formatDate = (date: Date): string => {
    return date.toLocaleDateString("fr-FR");
};

export const deuxDernieresSemaines = (annee: number): EndDatesYearsTypes => {
    // Dernier jour de l'année : 31 décembre
    let fin: Date = new Date(annee, 11, 31);

    // Trouver le lundi de la dernière semaine (lundi = 1, mais JS : lundi = 1 modulo)
    let dernierLundi: Date = new Date(fin);
    dernierLundi.setDate(fin.getDate() - ((fin.getDay() + 6) % 7));

    // Lundi de l'avant-dernière semaine
    let avantDernierLundi: Date = new Date(dernierLundi);
    avantDernierLundi.setDate(dernierLundi.getDate() - 7);

    // Calcul des mardis
    let avantDernierMardi: Date = new Date(avantDernierLundi);
    avantDernierMardi.setDate(avantDernierLundi.getDate() + 1);

    // Calcul des mercredi
    let avantDernierMercredi: Date = new Date(avantDernierLundi);
    avantDernierMercredi.setDate(avantDernierLundi.getDate() + 2);

    // Calcul des jeudis
    let avantDernierJeudi: Date = new Date(avantDernierLundi);
    avantDernierJeudi.setDate(avantDernierLundi.getDate() + 3);

    // Calcul des mardis
    let dernierMardi: Date = new Date(dernierLundi);
    dernierMardi.setDate(dernierLundi.getDate() + 1);

    // Calcul des mercredi
    let dernierMercredi: Date = new Date(dernierLundi);
    dernierMercredi.setDate(dernierLundi.getDate() + 2);

    // Calcul des jeudis
    let dernierJeudi: Date = new Date(dernierLundi);
    dernierJeudi.setDate(dernierLundi.getDate() + 3);

    let dernierVendredi: Date = new Date(dernierLundi);
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

/* 
	Génère des dates pour les 8 première semaines, 
	chaque nouvelle année après la première semaine 
	du nouvel an.
*/
export const generateCourseDates = (year: number): {day: string; date: string}[] => {
    // Fonction pour obtenir le premier lundi de l'année donnée
    function getFirstMondayOfYear(year: number) {
        let date: Date = new Date(year, 0, 1); // 1er janvier de l'année donnée
        // Cherche le premier lundi de l'année
        while (date.getDay() !== 1) {
            date.setDate(date.getDate() + 1); // Incrémenter jusqu'à trouver un lundi
        }
        return date;
    }

    // Fonction pour formater la date au format "jj/mm/aaaa"
    const formatDateGenerated = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Les mois commencent à 0 en JavaScript
        const year: number = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    let startDate: Date = getFirstMondayOfYear(year); // Obtenez le premier lundi après le Nouvel An
    let courses: {day: string; date: string}[] = [];

    // Générer les dates pour 8 semaines
    for (let week = 0; week < 8; week++) {
        let weekStartDate: Date = new Date(startDate); // Cloner la date du premier lundi
        weekStartDate.setDate(startDate.getDate() + (week * 7)); // Ajouter 7 jours pour chaque nouvelle semaine

        // Lundi : 3 cours à la même date (3x)
        let mondayCourseDate: Date = new Date(weekStartDate);
        for (let i = 0; i < 3; i++) {
            courses.push({ day: 'Lundi', date: formatDateGenerated(mondayCourseDate) });
        }

        // Mardi : 2 cours à la même date (2x)
        let tuesdayCourseDate: Date = new Date(weekStartDate);
        tuesdayCourseDate.setDate(weekStartDate.getDate() + 1); // Mardi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Mardi', date: formatDateGenerated(tuesdayCourseDate) });
        }

        // Mercredi : 2 cours à la même date (2x)
        let wednesdayCourseDate: Date = new Date(weekStartDate);
        wednesdayCourseDate.setDate(weekStartDate.getDate() + 2); // Mercredi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Mercredi', date: formatDateGenerated(wednesdayCourseDate) });
        }

        // Jeudi : 2 cours à la même date (2x)
        let thursdayCourseDate: Date = new Date(weekStartDate);
        thursdayCourseDate.setDate(weekStartDate.getDate() + 3); // Jeudi
        for (let i = 0; i < 2; i++) {
            courses.push({ day: 'Jeudi', date: formatDateGenerated(thursdayCourseDate) });
        }
    }
    return courses;
};