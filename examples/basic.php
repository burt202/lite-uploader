<?php

if ($_FILES['fileUpload']['name'][0]) {
    $uploadedUrl = 'uploads/' . $_FILES['fileUpload']['name'][0];
    move_uploaded_file($_FILES['fileUpload']['tmp_name'][0], $uploadedUrl);
}

echo json_encode('Ok');
exit;
