export type DataType = {
    items: ItemsType[];
};

export type ItemsType = {
    id: string;
    cmsLocaleId: string | null;
    lastPublished: string;
    lastUpdated: string;
    createdOn: string;
    isArchived: boolean;
    isDraft: boolean;
    fieldData: {
        intervenant: string;
        theme: string;
        descriptif: string;
        cours: string;
        name: string;
        heure: string;
        date: string;
        semaine: string;
        slug: string;
        'numero-du-cours': string;
        'lieu-du-cours': string;
        'id-value': {idValue: number};
        'image-popup': {
            fileId: string;
            url: string;
            alt: string | null;
        }
    }
};

export type InformationsType = {
    itemId: string;
    idValue: number;
    date: string;
    semaine: string;
    cours: string;
};

export type EndDatesYearsTypes = {
    avantDerniereSemaine: {
        debut: string;
    },
    derniereSemaine: {
        debut: string;
        fin: string;
    }
};