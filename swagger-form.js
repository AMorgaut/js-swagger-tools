// Few functions to generate client HTML interfaces

export function createChild(parent, childType) {
    return parent.appendChild(
        document.createElement(childType)
    );
}

function createDisable(parentNode, advancedParam, options) {
    const checkbox = createChild(parentNode, 'INPUT');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('checked', 'checked');
    if (advancedParam.required) {
        checkbox.setAttribute('disabled', 'disabled');
        checkbox.setAttribute('class', 'required');
        checkbox.title = options.requiredTips || 'This parameter is Required';
        return;
    }
    checkbox.title = options.disableTips || 'Uncheck to not send the parameter';
    const inputId = getInputId(parentNode, advancedParam, options);
    checkbox.addEventListener('click', () => {
        const input = document.getElementById(inputId);
        const inputs = input ?
            [input] :
            Array.from(document.getElementsByName(inputId)); // handle radio buttons
        if (checkbox.checked) {
            inputs.forEach(input => input.removeAttribute('disabled'));
        } else {
            inputs.forEach(input => input.setAttribute('disabled', 'disabled'));
        }
    })
}

function getInputId(parentNode, param, options) {
    return `${parentNode.id}-${options.prefix || ''}${param.name}`;
}

function createLabel(parentNode, param, options = {}) {
    const { name, description = '', required } = param;
    const label = createChild(parentNode, 'LABEL');
    label.setAttribute('for', getInputId(parentNode, param, options));
    if (required) {
        label.setAttribute('class', 'required');
    }
    label.title = description;
    label.append(`${name}: `);
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
    const { name, enum: enumList, required } = param;
    const { maxRadio = 5 } = options;
    if (!enumList) {
        throw new Error('No enum found for this parameter');
    }
    const id = getInputId(parentNode, param, options);
    if (enumList.length > maxRadio) {
        const select = createChild(parentNode, 'SELECT');
        if (required) {
            select.setAttribute('required', 'required');
        }
        select.id = id;
        select.name = name;
        enumList.map(value => {
            const option = createChild(select, 'OPTION');
            option.value = value;
            option.append(value);
            return option;
        });
        Object.defineProperty(getter, name, {
            enumerable: true,
            get () {
                return select.disabled ? undefined : select.value;
            }
        });
        return select;
    }
    const radioButtons = enumList.map(value => {
        const radio = createChild(parentNode, 'INPUT');
        if (required) {
            radio.setAttribute('required', 'required');
        }
        radio.id = `${id}:${value}`;
        radio.type = 'radio';
        radio.name = id;
        radio.value = value;
        const label = createChild(parentNode, 'LABEL');
        label.setAttribute('for', radio.id);
        label.append(value);
        return radio;
    });
    radioButtons[0].setAttribute('checked', 'checked');
    Object.defineProperty(getter, name, {
        enumerable: true,
        get () {
            return radioButtons[0].disabled ?
                undefined :
                radioButtons.find(radio => radio.checked).value;
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
    if (!input.placeholder) {
        input.placeholder = 'lorem ipsum';
    }
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
            return input.disabled ? undefined : input.value;
        }
    });
}

function createNumberInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'number';
    if (!input.placeholder) {
        input.placeholder = '0';
    }
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
            return input.disabled ? undefined : Number(input.value);
        }
    });
}

function createBooleanInput(parentNode, param, getter, options = {}) {
    const input = createInput(parentNode, param, options);
    input.type = 'checkbox';
    Object.defineProperty(getter, param.name, {
        enumerable: true,
        get () {
            return input.disabled ? undefined : input.checked;
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
            if (input.disabled) {
                return undefined;
            }
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
            if (input.disabled) {
                return undefined;
            }
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
            return input.disabled ? undefined : input.value;
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
            return input.disabled ? undefined : input.value;
        }
    });
}

function createObjectInput(parentNode, param, getter, options = {}) {
    const { name, properties, description, required = [] } = param;
    const object = {};
    getter[name] = object;
    options.prefix = `(${
        options.prefix ||
        parentNode.id ||
        parentNode.getElementsByTagName('legend')[0].innerText ||
        ''
    })${name}.`;
    const fieldset = createChild(parentNode, 'FIELDSET');
    const legend = createChild(fieldset, 'LEGEND');
    legend.append(name);
    if (description) {
        const blockquote = createChild(fieldset, 'BLOCKQUOTE');
        blockquote.append(description);
    }
    if (!properties) {
        const message = `This '${name}' object parameters should have defined properties`;
        console.error(message);
        const output = createChild(fieldset, 'OUTPUT');
        output.setAttribute('class', 'error');
        output.setAttribute('class', 'error');
        output.append(message);
        return;
    }
    for (const [name, property] of Object.entries(properties)) {
        property._required = required === true || required.includes(name);
        createChild(fieldset, 'BR');
        createParamInput(fieldset, { name, ...property }, object, options);
    }
    options.prefix = options.prefix.replace(new RegExp(`${name}\.$`), '');
}

function createArrayInput(parentNode, param, getter, options = {}) {
    const { name, description, schema = {}, minItems = 1, collectionFormat } = param;
    let { items = schema.items } = param;
    options.prefix = `(${
        options.prefix ||
        parentNode.id ||
        parentNode.getElementsByTagName('legend')[0].innerText ||
        ''
    })${name}.`;
    const fieldset = createChild(parentNode, 'FIELDSET');
    const legend = createChild(fieldset, 'LEGEND');
    legend.append(name);
    if (description) {
        const blockquote = createChild(fieldset, 'BLOCKQUOTE');
        blockquote.append(description);
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
    if (!items || !items.type) {
        const message = `This '${name}' array should have defined items > default to string`;
        console.error(message);
        items = Object.assign(items || {}, { type: 'string' });
    }
    const dl = createChild(fieldset, 'DL');

    function addItem(index) {
        const dd = createChild(dl, 'DD');
        createParamInput(dd, { name: index, ...items }, array, options);
    }

    let index = 0;
    while (index < minItems) {
        addItem(index);
        index += 1;
    }
    options.prefix = options.prefix.replace(new RegExp(`${name}$`), '');
    createChild(fieldset, 'BR');
    const button = createChild(fieldset, 'BUTTON');
    button.append(options.addItemlLabel || 'Add Item');
    button.addEventListener('click', () => addItem(index++));
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

// non-standard types - HTML5 / JS types - log error but don't crash
const EXTRA_TYPE_MAP = {
    number: createNumberInput,
    text: createStringInput,
    time: createStringInput,
    'datetime-local': createDateTimeInput,
};

/**
 *
 * @param {HTMLElement} parentNode
 * @param {Object} param
 * @param {string} param.name
 * @param {string} [param.type]
 * @param {string} [param.$ref]
 * @param {Object} [param.schema]
 * @param {string} [param.schema.type]
 * @param {string} [param.schema.$ref]
 * @param {Object} getter Object used to fetch the param values at any time
 * @param {Object} [options]
 * @param {Object} [options.swagger]
 * @param {number} [options.maxRadio]
 * @param {Function} [options.dateFormater]
 * @param {Function} [options.dateTimeFormater]
 */
export function createParamInput(parentNode, param, getter, options) {
    let { name, type, schema, $ref: ref, _required = false } = param;
    let advancedParam = param;
    if (!type && schema || ref) {
        type = schema && schema.type;
        if (!type) {
            const definitionRef = ref || schema['$ref'];
            let definitionName = '';
            const definition = definitionRef.split('/').reduce((result, current) => {
                if (result === '#') {
                    return options.swagger[current];
                }
                definitionName = current;
                return result[current];
            });
            if (!definition) {
                const message = `Definition '${definitionRef}' not found for param '${name}'`;
                console.error(message);
                const output = createChild(parentNode, 'OUTPUT');
                output.setAttribute('class', 'error');
                output.append(message);
                return;
            }
            advancedParam = { ...definition, name, definitionName };
            type = advancedParam.type;
        }
    }
    type = (type || '').toLowerCase();
    let createFunc = TYPE_MAP[type];
    if (!createFunc) {
        console.error(`This '${type}' type for param '${name}' is not valid`);
        createFunc = EXTRA_TYPE_MAP[type];
    }
    if (!createFunc) {
        const message = `Unkown type '${type}' for param '${name}'`;
        console.error(message);
        const output = createChild(parentNode, 'OUTPUT');
        output.setAttribute('class', 'error');
        output.append(message);
        return;
    }
    if (type !== 'object' && type !== 'array') {
        advancedParam.required = typeof advancedParam.required === 'boolean' ?
            advancedParam.required :
            _required;
        createDisable(parentNode, advancedParam, options);
        createLabel(parentNode, advancedParam, options);
    }
    createFunc(parentNode, advancedParam, getter, options);
}
