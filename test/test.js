import { createChild, createParamInput } from '../swagger-form.js';

const SWAGGER_URL = 'https://petstore.swagger.io/v2/swagger.json';
const APIS = [];
const OPTIONS = {};

function getApiByTag(tag) {
    let api = APIS.find(api => api.tag === tag);
    if (!api) {
        api = Object.assign(
            createChild(document.body, 'FIELDSET'),
            { tag, commands: [] }
        );
        const legend = createChild(api, 'LEGEND');
        legend.innerText = tag;
        APIS.push(api);
    }
    return api;
}

function createCommand(api, method, path, details) {
    const command = createChild(api, 'FIELDSET');
    const legend = createChild(command, 'LEGEND');
    legend.innerText = `${method.toUpperCase()} ${path}`;
    const p = createChild(command, 'P');
    p.innerText = details.summary;
    const params = {};
    details.parameters.forEach(param => {
        createParamInput(command, param, params, OPTIONS)
        createChild(command, 'BR');
    });
    const button = createChild(command, 'BUTTON');
    button.innerText = 'Submit';
}

async function start() {
    const swagger = await (await fetch(SWAGGER_URL)).json();
    // For YAML version, you can use https://github.com/jeremyfa/yaml.js
    // const swagger = YAML.parse(yaml);
    const { title, version } = swagger.info;
    const h1 = createChild(document.body, 'H1');
    h1.innerText = `${title} (${version})`;
    OPTIONS.definitions = swagger.definitions;
    for (const [path, methods] of Object.entries(swagger.paths)) {
        for (const [method, details] of Object.entries(methods)) {
            const api = getApiByTag(details.tags[0]);
            createCommand(api, method, path, details);
        }
    }
}

start();
