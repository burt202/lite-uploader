## Examples

Below are some examples to help get you started

### Basic

The most basic usage of the plugin

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php"
    })
    .on("lu:success", function (e, response) {
      alert("uploaded");
    });

### Using Click Handler

You can choose to either upload file on "change" of the file input, or on "click" of another element

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
      <button class="uploadBtn">Upload</button>
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php",
      changeHandler: false,
      clickElement: $(".uploadBtn")
    })
    .on("lu:success", function (e, response) {
      alert("uploaded");
    })

### Extra Params

Send extra params to your server script on and after instantiation

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php",
      params: {
        foo: "bar",
        abc: 123
      }
    })
    .on("lu:success", function (e, response) {
      alert("uploaded");
    })

    $(".fileUpload").data("liteUploader").addParam("another", "here");

### Cancel Upload

There is a build-in method to allow cancellation of the upload

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
      <button class="cancelBtn">Cancel</button>
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php"
    .on("lu:success", function (e, response) {
      alert("uploaded");
    })
    .on("lu:cancelled", function () {
      alert("upload aborted")
    });

    $(".cancelBtn").click(function () {
      $(".fileUpload").data("liteUploader").cancelUpload();
    });

### Progress

Use the progress event to get the completion percentage whilst uploading

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php"
    .on("lu:success", function (e, response) {
      alert("uploaded");
    })
    .on("lu:progress", function (e, percentage) {
      console.log(percentage);
    })

### Validation

Basic validation is built-in for file types and size

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
    </html>

    $(".fileUpload").liteUploader({
      script: "upload.php",
      rules: {
        allowedFileTypes: "image/jpeg,image/png,image/gif",
        maxSize: 250000
      }
    })
    .on("lu:errors", function (e, errors) {
      /*
        example errors content:
        [
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
        ]
      */
      console.log(errors);
    })

### Before Upload Request

You can dynamically change/update the form data packet before each upload using the beforeRequest option. This function must return a promise, where the resolved value is the ammended form data. Reject the promise to cancel the upload.

    <html>
      <input type="file" name="fileUpload" class="fileUpload" />
    </html>

    $(".fileUpload").liteUploader({
      script: "http://localhost:8081/test.php",
      params: {
        foo: "bar"
      },
      beforeRequest: function (files, formData) {
        formData.append("abc", 123);
        return $.Deferred().resolve(formData);
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
