<?php

$urls = array();

if (isset($_POST['liteUploader_id']) && $_POST['liteUploader_id'] == 'fileUpload1') {
    if ($_FILES['fileUpload1']['name']) {
        $uploadedUrl = 'uploads/' . $_FILES['fileUpload1']['name'];
        move_uploaded_file($_FILES['fileUpload1']['tmp_name'], $uploadedUrl);
        $urls[] = $uploadedUrl;
    }

    $message = 'Successfully Uploaded File(s) From First Upload Input';
}

if (isset($_POST['liteUploader_id']) && $_POST['liteUploader_id'] == 'fileUpload2') {
    foreach ($_FILES['fileUpload2']['error'] as $key => $error) {
        if ($error == UPLOAD_ERR_OK) {
            $uploadedUrl = 'uploads/' . $_FILES['fileUpload2']['name'][$key];
            move_uploaded_file( $_FILES['fileUpload2']['tmp_name'][$key], $uploadedUrl);
            $urls[] = $uploadedUrl;
        }
    }

    $message = 'Successfully Uploaded File(s) From Second Upload Input';
}

echo json_encode(
    array(
        'message' => $message,
        'urls' => $urls,
    )
);
exit;
