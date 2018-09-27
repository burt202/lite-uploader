## LiteUploader
[![npm](https://img.shields.io/npm/v/lite-uploader.svg)](https://www.npmjs.com/package/lite-uploader)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg)](LICENSE)
[![Build Status](https://travis-ci.org/burt202/lite-uploader.svg?branch=master)](https://travis-ci.org/burt202/lite-uploader)

[**Examples**](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md) |
[**Changelog**](https://github.com/burt202/lite-uploader/blob/master/docs/changelog.md)

This is a lightweight library for NodeJS and jQuery, aiming to make uploading files a doddle. With some useful options including basic validation, it is a good choice for any developer who is not so worried about supporting legacy browsers.

### Features

- dependency free
- file type and size validation
- support for custom validators
- hooks for all major events like progress, success, fail etc
- drag/drop support
- ability dynamically update the form data packet before each upload
- upload multiple files as individual requests

### NodeJS

`npm install lite-uploader --save`

### Browser

`<script src="../liteuploader.js"></script>`

jQuery is supported but optional

### Options

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>script</td>
    <td>String (required)</td>
    <td>null</td>
    <td>the path to the script file that will handle the upload</td>
  </tr>
  <tr>
    <td>ref</td>
    <td>String</td>
    <td>null</td>
    <td>The request argument name for the file form data. Will fallback to the name property of the file input field if not supplied.</td>
  </tr>
  <tr>
    <td>rules</td>
    <td>Object</td>
    <td>{allowedFileTypes: null, maxSize: null}</td>
    <td>object where you can specify validation rules for the files to be uploaded - current supported rules are:
      <ul>
        <li>allowedFileTypes (list of comma-separated mime-types, wildcards such as image/* are also supported)</li>
        <li>maxSize (in bytes)</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>params</td>
    <td>Object</td>
    <td>{}</td>
    <td>object of params to be sent to the server in addition to the files being uploaded</td>
  </tr>
  <tr>
    <td>headers</td>
    <td>Object</td>
    <td>{}</td>
    <td>object of headers to be sent to the server</td>
  </tr>
  <tr>
    <td>validators</td>
    <td>Array</td>
    <td>[]</td>
    <td>an array of functions that can take a File and return a validation result on it, see examples for usage</td>
  </tr>
  <tr>
    <td>singleFileUploads</td>
    <td>Boolean</td>
    <td>false</td>
    <td>set to true to upload each file of a selection using an individual request</td>
  </tr>
  <tr>
    <td>beforeRequest</td>
    <td>Function</td>
    <td colspan="2">Delay the file upload request by returning a promise. Recieves the Files and the FormData. Expected to resolve with the FormData to continue. Reject to stop upload.</td>
  </tr>
</table>

### Events

<table>
  <tr>
    <th>Name</th>
    <th>Parameters</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>lu:errors</td>
    <td>eventName, errors</td>
    <td>triggered when errors are found, including built-in and custom validators - see 'Error Types' section for more</td>
  </tr>
  <tr>
    <td>lu:start</td>
    <td>eventName, files</td>
    <td>triggered before any uploading starts</td>
  </tr>
  <tr>
    <td>lu:finish</td>
    <td>eventName</td>
    <td>triggered when all uploading has finished</td>
  </tr>
  <tr>
    <td>lu:before</td>
    <td>eventName, files</td>
    <td>triggered before each request to the server</td>
  </tr>
  <tr>
    <td>lu:progress</td>
    <td>eventName, {percentage, files}</td>
    <td>triggered whilst uploading files</td>
  </tr>
  <tr>
    <td>lu:success</td>
    <td>eventName, response</td>
    <td>triggered on a successful request to the server</td>
  </tr>
  <tr>
    <td>lu:fail</td>
    <td>eventName, jqXHR</td>
    <td>triggered on a failed request to the server</td>
  </tr>
  <tr>
    <td>lu:cancelled</td>
    <td>eventName</td>
    <td>triggered on upload abort</td>
  </tr>
</table>

### Error Types

Below is an overview of the built-in error types that can be returned when validating files

* type - when file mime type does not match any mime types supplied in the rule.allowedFileTypes option
* size - when file size is above the size (in bytes) supplied in the rule.maxSize option
* refRequired - when there is no name attribute on the file input and no 'ref' options is passed to the plugin
* scriptRequired - when no 'script' option is passed to the plugin

### Public API

#### startUpload(files)

Starts the upload

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>files</td>
    <td>FileList (optional)</td>
    <td>null</td>
    <td>a list of files to be uploaded, takes priority over default mechanism if supplied</td>
  </tr>
</table>

#### addParam(key, value)

Allows parameters to be added after plugin instantiation

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>key</td>
    <td>String (required)</td>
    <td>n/a</td>
    <td>name of parameter to be added</td>
  </tr>
  <tr>
    <td>value</td>
    <td>String (required)</td>
    <td>n/a</td>
    <td>value of parameter to be added</td>
  </tr>
</table>

#### cancelUpload()

Allows the upload to be cancelled, triggers `lu:cancelled`

<table>
  <tr>
    <th>Name</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td colspan="4">No parameters</td>
  </tr>
</table>

### Browser Support

* Chrome 45+
* Firefox 34+
* Edge 12+
* Internet Explorer NO (because [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) and [Object.assign](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/assign) are used)
* Safari 9+
* Opera 32+

### License

Licensed under the MIT License.

View the full license [here](https://raw.githubusercontent.com/burt202/lite-uploader/master/LICENSE).
