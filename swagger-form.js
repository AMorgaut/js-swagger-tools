// Few functions to generate client HTML interfaces

export function createChild(parent, childType) {
    return parent.appendChild(
        document.createElement(childType)
    );
}

function getInputId(parentNode, param, options) {
    return `${parentNode.id}-${options.prefix || ''}${param.name}`;
}

function createLabel(parentNode, param, options = {}) {
    const { name, description = '' } = param;
    const label = createChild(parentNode, 'LABEL');
    label.setAttribute('for', getInputId(parentNode, param, options));
    label.innerText = `${name}: `;
    label.title = description;
    return label;
}

function createInput(parentNode, param, options) {
    const { required, example = '' } = param;
    const input = createChild(parentNode, 'INPUT');
    input.setAttribute('id', getInputId(parentNode, param, options));
    if (required) {
        input.setAttribute('required', 'required');
    }
    input.placeholder = example;
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
        enumList.map(value => {
            const option = createChild(select, 'OPTION');
            option.value = value;
            option.innerText = value;
            return option;
        });
        Object.defineProperty(getter, name, {
            enumerable: true,
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
        enumerable: true,
        get () {
            return radioButtons.find(radio => radio.checked).value;
        }
    });
}

function createStringInput(parentNode, param, getter, options = {}) {
    if (param.enum) {
        return createEnumInput(parentNode, param, getter, options);
    }
    if (param.format === 'date') {
        return createDateInput(parentNode, param, getter, options);
    }
    if (param.format === 'date-time') {
        return createDateTimeInput(parentNode, param, getter, options);
    }
    const input = createInput(parentNode, param, options);
    const { maxLength, minLength, pattern } = param;
    if (typeof maxLength !== 'undefined') {
        input.setAttribute('maxLength', maxLength);
    }
    if (typeof minLength !== 'undefined') {
        input.setAttribute('minLength', minLength);
    }
    if (typeof pattern !== 'undefined') {
        input.setAttribute('pattern', pattern);
    }
    Object.defineProperty(getter, param.name, {
        enumerable: true,
        get () {
            return input.value;
        }
    });
}

function createNumberInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'number';
    const { maximum, exclusiveMaximum, minimum, exclusiveMinimum } = param;
    if (typeof maximum !== 'undefined') {
        input.setAttribute('max', Number(maximum) - (exclusiveMaximum ? 1 : 0));
    }
    if (typeof minimum !== 'undefined') {
        input.setAttribute('min', Number(minimum) - (exclusiveMinimum ? 1 : 0));
    }
    Object.defineProperty(getter, param.name, {
        enumerable: true,
        get () {
            return Number(input.value);
        }
    });
}

function createBooleanInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'checkbox';
    Object.defineProperty(getter, param.name, {
        enumerable: true,
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
        enumerable: true,
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
    input.type = 'datetime-local';
    const { dateTimeFormater } = options;
    Object.defineProperty(getter, param.name, {
        enumerable: true,
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
        enumerable: true,
        get () {
            return input.value;
        }
    });
}

function createFileInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'file';
    const { fileFormater } = options;
    Object.defineProperty(getter, param.name, {
        enumerable: true,
        get () {
            if (fileFormater) {
                return fileFormater(input.files);
            }
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
    const fieldset = createChild(parentNode, 'FIELDSET');
    const legend = createChild(fieldset, 'LEGEND');
    legend.innerText = name;
    for (const [name, property] of Object.entries(properties)) {
        createChild(fieldset, 'BR');
        createParamInput(fieldset, { name, ...property }, object, options);
    }
    options.prefix = options.prefix.replace(new RegExp(`${name}\.$`), '');
}

function createArrayInput(parentNode, param, getter, options = {}) {
    const { name, schema = {}, items, minItems = 1, collectionFormat } = param;
    if (!items && !schema.items) {
        throw new Error('This object parameters should have items');
    }
    const array = [];
    Object.defineProperty(getter, name, {
        enumerable: true,
        get () {
            switch (collectionFormat) {
                case 'csv': return array.join(',');
                case 'ssv': return array.join(' ');
                case 'tsv': return array.join('\t');
                case 'pipes': return array.join('|');
                case 'multi': return array.map(encodeURIComponent);
                default: return array;
            }
        }
    });
    options.prefix = `${options.prefix || ''}${name}`;
    const fieldset = createChild(parentNode, 'FIELDSET');
    const legend = createChild(fieldset, 'LEGEND');
    legend.innerText = name;
    for (let index = 0; index < minItems; index += 1) {
        createParamInput(
            fieldset,
            { name: index, ...(items || schema.items) },
            array,
            options
        );
        createChild(fieldset, 'BR');
    }
    options.prefix = options.prefix.replace(new RegExp(`${name}$`), '');
    // TODO create a button to add item inputs
    const button = createChild(fieldset, 'BUTTON');
    button.innerText = 'Add Item';
}

const TYPE_MAP = {
    integer: createNumberInput,
    long: createNumberInput,
    float: createNumberInput,
    double: createNumberInput,
    string: createStringInput,
    byte: createStringInput,
    binary: createStringInput,
    file: createFileInput,
    boolean: createBooleanInput,
    date: createDateInput,
    datetime: createDateTimeInput,
    password: createPasswordInput,
    object: createObjectInput,
    array: createArrayInput,
};

/**
 *
 * @param {HTMLElement} parentNode
 * @param {Object} param
 * @param {Object} getter
 * @param {Object} [options]
 * @param {Object} [options.definitions]
 * @param {number} [options.maxRadio]
 * @param {Function} [options.dateFormater]
 * @param {Function} [options.dateTimeFormater]
 */
export function createParamInput(parentNode, param, getter, options) {
    let { name, type, schema, $ref: ref } = param;
    let advancedParam = param;
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
    if (type !== 'object' && type !== 'array') {
        createLabel(parentNode, advancedParam, options);
    }
    createFunc(parentNode, advancedParam, getter, options);
}
