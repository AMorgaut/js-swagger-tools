# js-swagger-tools

Few scripts to use swagger files

## About

Expose a `createParamInput(parentNode, param, getter, options)` method that

1. create the most adapted input regarding the param type (text, number, checkbox, radio, select, password, ...)
  * create associated inputs for each properties in case of an object parameter
  * allow mutiple values in case of an array parameter
  * retrieve `$ref` definitions from `options.definitions`
  * switch from radio to select input can be configured via `options.maxRadio`
2. add the input element(s) to the parent node
3. retrieve the input value from the getter object as an enumerable property (working with `JSON.stringify()`)
  * the getter transform the value to the right JS type for better support by `JSON.stringify()` (or `YAML.stringify()`)
  * the getter can call `options.dateFormater()` or `options.dateTimeFormater()` custom transformers if provided

Also expose a `createChild(parent, childType)` little helper that append a new child element to the parent node and returns it.

## Example

See the test example in the [`test` folder](./test)

## MIT License

Copyright (c) 2019 Alexandre Morgaut

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
