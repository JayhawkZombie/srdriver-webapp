import React from "react";
import { Button } from "@blueprintjs/core";
import styles from "./IconControl.module.css";

interface IconControlProps {
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: React.ReactNode; // Should be a Blueprint icon
  title?: string;
  className?: string;
}

const IconControl: React.FC<IconControlProps> = ({ onClick, children, title, className }) => (
  <Button
    minimal
    className={`${styles.iconControl} bp5-button ${className}`}
    onClick={onClick}
    title={title}
    small
  >
    {children}
  </Button>
);

export default IconControl; 