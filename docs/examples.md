## Examples

* [Basic usage](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#basic-usage)
* [Handling errors](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#handling-errors)
* [Adding extra params](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#adding-extra-params)
* [Adding headers](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#adding-headers)
* [Cancelling an upload](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#cancelling-an-upload)
* [Progress event](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#progress-event)
* [Progress event on multiple files](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#progress-event-on-multiple-files)
* [Validation](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#validation)
* [Custom validators](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#custom-validators)
* [Before request event](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#before-request-event)
* [Getting the url dynamically](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#getting-the-url-dynamically)
* [Previewing images](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#previewing-images)
* [Drag and drop](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#drag-and-drop)
* [Uploading multiple files individually](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#uploading-multiple-files-individually)
* [Using within node](https://github.com/burt202/lite-uploader/blob/master/docs/examples.md#using-within-node)

### Basic usage

The most basic usage of the plugin

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php"
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Handling Errors

Use the fail event to track if your upload script encounters any errors

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/error.php"
      })
      .on("lu:fail", function (e, {xhr}) {
        console.log(xhr.status, JSON.parse(xhr.responseText));
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Adding Extra Params

Send extra params to your server script on and after instantiation

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        params: {
          foo: "bar",
          abc: 123
        }
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      });

      $(".fileUpload").data("liteUploader").addParam("another", "here");

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Adding Headers

Add custom headers to your request by using the headers option

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        headers: {
          "xxx": "foobar"
        }
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Cancelling An Upload

There is a built-in method to allow cancellation of the upload

    <input type="file" name="fileUpload" class="fileUpload" />
    <button class="cancelBtn">Cancel</button>

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php"
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      })
      .on("lu:cancelled", function () {
        console.log("upload aborted");
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });

      $(".cancelBtn").click(function () {
        $(".fileUpload").data("liteUploader").cancelUpload();
      });
    </script>

### Progress Event

Use the progress event to get the completion percentage whilst uploading

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php"
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      })
      .on("lu:progress", function (e, {percentage}) {
        console.log(percentage);
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Progress Event On Multiple Files

How to track progress on multiple files when uploading them one by one (using singleFileUploads option)

    <input type="file" name="fileUpload[]" class="fileUpload" multiple />
    <pre></pre>

    <script>
      const progress = {};

      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        singleFileUploads: true
      })
      .on("lu:before", function (e, {files}) {
        const fileName = files[0].name;
        progress[fileName] = 0;
      })
      .on("lu:progress", function (e, {files, percentage}) {
        const fileName = files[0].name;
        progress[fileName] = percentage;
        const el = document.querySelector("pre");
        el.innerHTML = JSON.stringify(progress, null, 2);
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Validation

Basic validation is built-in for file types and size

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        rules: {
          allowedFileTypes: "image/jpeg,image/png,image/gif",
          maxSize: 250000
        }
      })
      .on("lu:errors", function (e, {errors}) {
        console.log(errors);
        /*
          example errors content:
          {
            name: "fileName",
            errors: [
              {
                type: "size",
                rule: 250000,
                given: 300000
              }
            ]
          }
        */
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Custom Validators

Use the validators option to add custom rules for your files. Each custom validator gets a file passed in and should return a error message if the rule doesnt pass, or null/undefined if no issue is found. Custom validators can return promises.

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      const enforceMaximumWidth = function (file) {
        return new Promise(function (resolve) {
          const reader = new FileReader();

          reader.onload = function (evt) {
            const image = new Image();

            image.onload = function () {
              const error = (this.width > 100) ? "Error: rule: 100, given: " + this.width : null;
              resolve(error);
            };

            image.src = evt.target.result;
          };

          reader.readAsDataURL(file);
        });
      }

      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        validators: [enforceMaximumWidth]
      })
      .on("lu:errors", function (e, {errors}) {
        console.log(errors);
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Before Request Event

You can dynamically change/update the form data packet before each upload using the beforeRequest option. This function must return a promise, where the resolved value is the ammended form data. Reject the promise to cancel the upload.

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        params: {
          foo: "bar"
        },
        beforeRequest: function (files, formData) {
          formData.append("abc", 123);
          return Promise.resolve(formData);
        }
      });

      /*
        form data to be sent to the server:
        {
          files....
          foo: "bar",
          abc: 123.
        }
      */

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Getting The URL Dynamically

Sometimes you might need to dynamically get the url based on the file payload you're about to upload. If you pass a function in as the url option, you can do exactly that. The function must return a Promise resolving a url.

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: function (files) {
          return Promise.resolve("http://localhost:8000/test/test.php");
        }
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Previewing Images

Use the before event to get a hold of the images to be uploaded, and display them on screen as a preview

    <input type="file" name="fileUpload[]" class="fileUpload" multiple />
    <div class="preview"></div>

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php"
      })
      .on("lu:before", function (e, {files}) {
        const el = document.querySelector(".preview");

        Array.prototype.forEach.call(files, function (file) {
          const reader = new FileReader();

          reader.onload = function (e) {
            const image = document.createElement("img");
            image.src = e.target.result;
            el.appendChild(image);
          };

          reader.readAsDataURL(file);
        });
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Drag And Drop

Invoke startUpload method with a FileList

    <div class="dropZone" style="height: 100px; width: 100px; border: 1px solid #000;"></div>

    <script>
      $(".dropZone").liteUploader({
        url: "http://localhost:8000/test/test.php",
        ref: "fileUpload"
      })
      .on("lu:success", function (e, {response}) {
        console.log(response);
      })
      .on("drag dragstart dragend dragover dragenter dragleave drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
      })
      .on("dragover dragenter", function () {
        $(this).addClass("hover");
      })
      .on("dragleave dragend drop", function () {
        $(this).removeClass("hover");
      })
      .on("drop", function(e) {
        $(this).data("liteUploader").startUpload(e.originalEvent.dataTransfer.files);
      });
    </script>

### Uploading Multiple Files Individually

You can split multiple files into separate requests if required using the singleFileUploads option

    <input type="file" name="fileUpload[]" multiple class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        url: "http://localhost:8000/test/test.php",
        singleFileUploads: true
      });

      /*
        expect test.php to be called once for each file in the selection
      */

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Using Within Node

You can use it within node with or without jquery

    const LiteUploader = require("lite-uploader");

    const options = {url: "test.php"};  // takes all of the documented options

    const onEvent = function (name, value) {
      // called on all documented events
    };

    const liteUploader = new LiteUploader(options, onEvent)
    const files = "a FileList"
    liteUploader.startUpload(files)

OR

    global.$ = require("jquery")
    require("lite-uploader")

    $(".fileUpload").liteUploader({
      url: "http://localhost:8000/test/test.php"
    })

    $(".fileUpload").change(function () {
      $(this).data("liteUploader").startUpload();
    });
