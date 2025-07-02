import React from "react";
import SliderControl from "./SliderControl";
import Box from "@mui/material/Box";

export default {
  title: "RefactoredTimeline/SliderControl",
};

export const Basic = () => {
  const [value, setValue] = React.useState(5);
  return (
    <Box sx={{ width: 350, bgcolor: "#222", p: 2, borderRadius: 2, color: "#fff", mx: "auto", display: "flex", alignItems: "center", gap: 2 }}>
      <SliderControl
        min={0}
        max={10}
        step={0.01}
        value={value}
        onChange={setValue}
        label="Value:"
      />
      <span style={{ fontFamily: "monospace", fontSize: 15 }}>{value.toFixed(2)}</span>
    </Box>
  );
}; 