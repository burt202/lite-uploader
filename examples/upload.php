<?php

foreach ($_FILES['fileUpload']['error'] as $key => $error)
{
    if ($error == UPLOAD_ERR_OK)
	{
        move_uploaded_file( $_FILES['fileUpload']['tmp_name'][$key], 'uploads/' . $_FILES['fileUpload']['name'][$key]);
    }
}

echo 'Successfully Uploaded File(s)';

?>
