import React, { useState, useRef } from "react";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import styles from "./ImageEditor.module.css";
import {
  BiRotateLeft,
  BiRotateRight,
  BiReset,
  BiDownload,
  BiUpload,
} from "react-icons/bi";
import ControlButton from "./ControlButton.jsx";
import UploadImageButton from "./UploadImageButton.jsx";

function ImageEditor() {
  const [scale, setScale] = useState(1);
  const cropperRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(
    "https://raw.githubusercontent.com/roadmanfong/react-cropper/master/example/img/child.jpg"
  );
  const [croppedImage, setCroppedImage] = useState(null);

  const onRotate = direction => () => {
    const angleConfig = {
      left: -30,
      right: 30,
    };
    const angle = angleConfig[direction] || 0;
    cropperRef.current.cropper.rotate(angle);
  };

  const onScale = e => {
    const scaleValue = parseFloat(e.target.value);
    setScale(scaleValue);
    cropperRef.current.cropper.scale(scaleValue);
  };

  const onReset = () => {
    const cropper = cropperRef.current.cropper;
    cropper.reset();
    setScale(1);
    setCroppedImage(null); // Clear the preview on reset
  };

  const onDownload = () => {
    const data = cropperRef.current.cropper.getCroppedCanvas();
    data.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "React_Image_Editor.jpg";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const onCrop = () => {
    const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
    if (croppedCanvas) {
      const croppedUrl = croppedCanvas.toDataURL();
      console.log(croppedUrl)
      setCroppedImage(croppedUrl);
    }
  };

  const uploadToBackend = async () => {
    const croppedCanvas = cropperRef.current.cropper.getCroppedCanvas();
    if (croppedCanvas) {
      croppedCanvas.toBlob(async blob => {
        const formData = new FormData();
        console.log(blob)
        formData.append("image", blob);
        
        try {
          const response = await fetch("http://localhost:5000/upload", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            alert("Image uploaded successfully!");
          } else {
            alert("Image upload failed.");
          }
        } catch (error) {
          console.error("Upload error:", error);
          alert("An error occurred while uploading the image.");
        }
      });
    }
  };

  const onImageUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = e => {
      setImageSrc(e.target.result);
      cropperRef.current.cropper.reset();
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.imageEditor}>
      <div>
        <Cropper
          src={imageSrc}
          style={{ height: 200, width: 250 }}
          initialAspectRatio={16 / 9}
          guides={false}
          ref={cropperRef}
          crop={onCrop}
        />
        <div className={styles.controlsBlock}>
          <ControlButton tooltip="Rotate Left" onClick={onRotate("left")}>
            <BiRotateLeft size={30} />
          </ControlButton>
          <ControlButton tooltip="Rotate Right" onClick={onRotate("right")}>
            <BiRotateRight size={30} />
          </ControlButton>
          <div className={styles.scaleFieldBlock}>
            <input
              type="range"
              min="0.2"
              max="2"
              step="0.2"
              value={scale}
              aria-label="scale"
              id="scale"
              onChange={onScale}
            />
            <label htmlFor="scale">Scale</label>
          </div>
          <ControlButton tooltip="Reset" onClick={onReset}>
            <BiReset size={30} />
          </ControlButton>
          <ControlButton tooltip="Download Image" onClick={onDownload}>
            <BiDownload size={30} />
          </ControlButton>
          <ControlButton tooltip="Upload Image" onClick={uploadToBackend}>
            <BiUpload size={30} />
          </ControlButton>
        </div>
        <UploadImageButton onImageUpload={onImageUpload} />
      </div>
      {croppedImage && (
        <div className={styles.previewBlock}>
          <h3>Cropped Image Preview:</h3>
          <img src={croppedImage} alt="Cropped Preview" className="w-[250px]" />
        </div>
      )}
    </div>
  );
}

export default ImageEditor;
