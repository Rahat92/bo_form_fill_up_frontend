import React from "react";
import styles from "./ImageEditor.module.css";

function UploadImageButton(props) {
  const { onImageUpload } = props;
  return (
    <div className={styles.imageUploadBlock}>
      <label className={styles.imageUploadLabel} htmlFor="image-upload">
        Upload image
      </label>
      <input type="file" id="image-upload" onChange={onImageUpload} />
    </div>
  );
}

export default UploadImageButton;
