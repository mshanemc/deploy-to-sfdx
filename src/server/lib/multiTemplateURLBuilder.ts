// TODO: test this and convert the other instances to it
const multiTemplateURLBuilder = (templatesURLs: string[] | string, preQueryURL: string = ''): string => {
    if (Array.isArray(templatesURLs)) {
        return `${preQueryURL}?template=${templatesURLs.join('&template=')}`;
    } else {
        return `${preQueryURL}?template=${templatesURLs}`;
    }
};

export { multiTemplateURLBuilder };
