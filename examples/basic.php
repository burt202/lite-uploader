<?php

if ($_FILES['fileUpload']['name']) {
    $uploadedUrl = 'uploads/' . $_FILES['fileUpload']['name'];
    move_uploaded_file($_FILES['fileUpload']['tmp_name'], $uploadedUrl);
}

echo json_encode('Ok');
exit;
