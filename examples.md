## Examples

Below are some examples to help get you started

### Basic

The most basic usage of the plugin

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php"
      })
      .on("lu:success", function (e, response) {
        console.log(response);
        alert("uploaded");
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Extra Params

Send extra params to your server script on and after instantiation

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php",
        params: {
          foo: "bar",
          abc: 123
        }
      })
      .on("lu:success", function (e, response) {
        alert("uploaded");
      });

      $(".fileUpload").data("liteUploader").addParam("another", "here");

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Add Headers

Add custom headers to your request by using the headers option

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php",
        headers: {
          "xxx": "foobar"
        }
      })
      .on("lu:success", function (e, response) {
        alert("uploaded");
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### Cancel Upload

There is a build-in method to allow cancellation of the upload

    <input type="file" name="fileUpload" class="fileUpload" />
    <button class="cancelBtn">Cancel</button>

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php"
      })
      .on("lu:success", function (e, response) {
        alert("uploaded");
      })
      .on("lu:cancelled", function () {
        alert("upload aborted");
      });

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });

      $(".cancelBtn").click(function () {
        $(".fileUpload").data("liteUploader").cancelUpload();
      });
    </script>

### Progress

Use the progress event to get the completion percentage whilst uploading

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php"
      })
      .on("lu:success", function (e, response) {
        alert("uploaded");
      })
      .on("lu:progress", function (e, percentage) {
        console.log(percentage);
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
        script: "http://localhost:8081/test.php",
        rules: {
          allowedFileTypes: "image/jpeg,image/png,image/gif",
          maxSize: 250000
        }
      })
      .on("lu:errors", function (e, errors) {
        /*
          example err1 content:
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

### Before Upload Request

You can dynamically change/update the form data packet before each upload using the beforeRequest option. This function must return a promise, where the resolved value is the ammended form data. Reject the promise to cancel the upload.

    <input type="file" name="fileUpload" class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php",
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

### Multiple Files With Multiple Requests

You can split multiple files into separate requests if required using the singleFileUploads option

    <input type="file" name="fileUpload[]" multiple class="fileUpload" />

    <script>
      $(".fileUpload").liteUploader({
        script: "http://localhost:8081/test.php",
        singleFileUploads: true
      });

      /*
        expect test.php to be called once for each file in the selection
      */

      $(".fileUpload").change(function () {
        $(this).data("liteUploader").startUpload();
      });
    </script>

### As Standalone Class

You can use it within node context. Useful if you are using a module bundling tool or if you dont want to use it as a pure jquery plugin.

    var LiteUploader = require("lite-uploader");

    var options = {script: "test.php"};  // takes all of the documented options
    var getFiles = function () {
      // return a FileList
    };
    var onEvent = function (name, value) {
      // called on all documented events
    };

    var liteUploader = new LiteUploader(options, getFiles, onEvent)

### Passing A FileList In As A Parameter

Use startUpload method by passing in a FileList. Works well for drag/drop file upload

    <div class="dropZone" style="height: 100px; width: 100px; border: 1px solid #000;"></div>

    <script>

      $(".dropZone").liteUploader({
        script: "http://localhost:8081/test.php",
        ref: "fileUpload"
      })
      .on("lu:success", function () {
        alert("uploaded");
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
