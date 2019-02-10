// Few functions to generate client HTML interfaces

export function createChild(parent, childType) {
    return parent.appendChild(
        document.createElement(childType)
    );
}

function getInputId(parentNode, param, options) {
    return `${parentNode.id}-${options.prefix || ''}${param.name}`;
}

function createLabel(parentNode, param, options) {
    const { name, description = '' } = param;
    const label = createChild(parentNode, 'LABEL');
    label.setAttribute('for', getInputId(parentNode, param, options));
    label.innerText = `${name}: `;
    label.title = description;
    return label;
}

function createInput(parentNode, param, options) {
    const input = createChild(parentNode, 'INPUT');
    input.setAttribute('id', getInputId(parentNode, param, options));
    input.placeholder = param.example || '';
    return input;
}

/**
 * 
 * @param {HTMLElement} parentNode 
 * @param {Object} param swagger parameter  
 * @param {Object} getter result object that will fetch the param value
 * @param {Object} [options] max number of enum values to switch from <input radio> to <select>
 * @param {number} [options.maxRadio] max number of enum values to switch from <input radio> to <select>
 */
function createEnumInput(parentNode, param, getter, options) {
    const { name, enum: enumList } = param;
    const { maxRadio = 5 } = options;
    if (!enumList) {
        throw new Error('No enum found for this parameter');
    }
    const id = getInputId(parentNode, param, options);
    if (enumList.length > maxRadio) {
        const select = createChild(parentNode, 'SELECT');
        select.id = id;
        select.name = name;
        const options = enumList.map(value => {
            const option = createChild(select, 'OPTION');
            option.value = value;
            option.innerText = value;
            return option;
        });
        Object.defineProperty(getter, name, {
            get () {
                return select.value;
            }
        });
        return select;
    }
    const radioButtons = enumList.map(value => {
        const radio = createChild(parentNode, 'INPUT');
        radio.id = `${id}:${value}`;
        radio.type = 'radio';
        radio.name = name;
        radio.value = value;
        const label = createChild(parentNode, 'LABEL');
        label.for = radio.id;
        label.innerText = value;
        return radio;
    });
    Object.defineProperty(getter, name, {
        get () {
            return radioButtons.find(radio => radio.checked).value;
        }
    });
}

function createStringInput(parentNode, param, getter, options = {}) {
    if (param.enum) {
        return createEnumInput(parentNode, param, getter, options);
    }
    const input = createInput(parentNode, param, options);
    Object.defineProperty(getter, param.name, {
        get () {
            return input.value;
        }
    });
}

function createNumberInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'number';
    Object.defineProperty(getter, param.name, {
        get () {
            return Number(input.value);
        }
    });
}

function createBooleanInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'checkbox';
    Object.defineProperty(getter, param.name, {
        get () {
            return input.checked;
        }
    });
}

function createDateInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'date';
    const { dateFormater } = options;
    Object.defineProperty(getter, param.name, {
        get () {
            if (dateFormater) {
                return dateFormater(input.value);
            }
            return input.value;
        }
    });
}

function createDateTimeInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'date';
    const { dateTimeFormater } = options;
    Object.defineProperty(getter, param.name, {
        get () {
            if (dateTimeFormater) {
                return dateTimeFormater(input.value);
            }
            return input.value;
        }
    });
}

function createPasswordInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'password';
    Object.defineProperty(getter, param.name, {
        get () {
            return input.value;
        }
    });
}

function createObjectInput(parentNode, param, getter, options = {}) {
    const { name, properties } = param;
    if (!properties) {
        throw new Error('This object parameters should have properties');
    }
    const object = {};
    getter[name] = object;
    options.prefix = `${options.prefix || ''}${name}.`;
    createLabel(parentNode, param, options);
    for (const [name, property] of Object.entries(properties)) {
        createChild(parentNode, 'BR');  
        createParamInput(parentNode, { name, ...property }, object, options);
    }
}

function createArrayInput(parentNode, param, getter, options = {}) {
    const { name, items } = param;
    if (!items) {
        throw new Error('This object parameters should have properties');
    }
    const array = [];
    getter[name] = array;
    options.prefix = `${options.prefix || ''}${name}.`;
    createLabel(parentNode, param, options);
    for (let index = 0; index < 3; index += 1) {
        createChild(parentNode, 'BR');  
        createParamInput(parentNode, { name: index, ...items }, array, options);
    }
    // TODO create a button to add item inputs
}

const TYPE_MAP = {
    integer: createNumberInput,
    long: createNumberInput,
    float: createNumberInput,
    double: createNumberInput,
    string: createStringInput,
    byte: createStringInput,
    binary: createStringInput,
    boolean: createBooleanInput,
    date: createDateInput,
    datetime: createDateTimeInput,
    password: createPasswordInput,
    object: createObjectInput,
    array: createArrayInput
};

/**
 * 
 * @param {HTMLElement} parentNode 
 * @param {Object} param 
 * @param {Object} getter 
 * @param {Object} [options]
 * @param {number} [options.maxRadio]
 * @param {Function} [options.dateFormater]
 * @param {Function} [options.dateTimeFormater]
 */
export function createParamInput(parentNode, param, getter, options) {
    let { name, type, schema, $ref: ref } = param;
    let advancedParam;
    if (!type && schema || ref) {
        type = schema && schema.type;
        if (!type) {
            const definitionPath = (ref || schema['$ref']).substr(14);
            advancedParam = { ...options.definitions[definitionPath], name };
            type = advancedParam.type;
        }
    }
    const createFunc = TYPE_MAP[type];
    if (!createFunc) {
        throw new Error(`Unkown Swagger type ${type} for param ${name}`);
    }
    createLabel(parentNode, advancedParam || param, options);
    createFunc(parentNode, advancedParam || param, getter, options);
}