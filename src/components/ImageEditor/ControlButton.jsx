import React from "react";
import styles from "./ImageEditor.module.css";

function ControlButton(props) {
  const { children, tooltip = "", ...buttonProps } = props;
  return (
    <button
      data-tip={tooltip}
      data-effect="solid"
      data-place="bottom"
      data-background-color="#6d28d9"
      className={styles.controlButton}
      {...buttonProps}
    >
      {children}
    </button>
  );
}

export default ControlButton;
