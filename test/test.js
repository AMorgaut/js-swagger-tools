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
    const commandTitle = `${method.toUpperCase()} ${path}`;
    command.id = commandTitle;
    legend.append(commandTitle);
    const p = createChild(command, 'P');
    p.append(details.summary);
    const params = {};
    (details.parameters || []).forEach((param) => {
        createParamInput(command, param, params, OPTIONS)
        createChild(command, 'BR');
    });
    const button = createChild(command, 'BUTTON');
    button.append('Submit');
    button.addEventListener('click', () => alert(`${commandTitle} 

${JSON.stringify(params, null, '  ')}
`));
}

async function start() {
    const swagger = await (await fetch(SWAGGER_URL)).json();
    // For YAML version, you can use https://github.com/jeremyfa/yaml.js
    // const yaml = await (await fetch(SWAGGER_URL)).text();
    // const swagger = YAML.parse(yaml);
    const { title, version } = swagger.info;
    const h1 = createChild(document.body, 'H1');
    h1.innerText = `${title} (${version})`;
    OPTIONS.swagger = swagger;
    for (const [path, methods] of Object.entries(swagger.paths)) {
        for (const [method, details] of Object.entries(methods)) {
            const api = getApiByTag(details.tags[0]);
            createCommand(api, method, path, details);
        }
    }
}

start();
