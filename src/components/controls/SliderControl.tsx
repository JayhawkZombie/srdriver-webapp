import React from "react";
import { Slider } from "@blueprintjs/core";
import styles from "./SliderControl.module.css";

interface SliderControlProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  tooltip?: string;
}

const SliderControl: React.FC<SliderControlProps> = ({ min, max, step = 0.01, value, onChange, label, tooltip }) => (
  <div className={styles.sliderControl} title={tooltip}>
    {label && <span className={styles.label}>{label}</span>}
    <Slider
      min={min}
      max={max}
      stepSize={step}
      labelStepSize={max - min}
      value={value}
      onChange={onChange}
      className={styles.slider}
      intent="primary"
      vertical={false}
      labelRenderer={false}
    />
  </div>
);

export default SliderControl; 