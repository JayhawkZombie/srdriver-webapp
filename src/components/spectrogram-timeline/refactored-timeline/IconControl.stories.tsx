import React from "react";
import IconControl from "./IconControl";
import { Icon } from "@blueprintjs/core";
import Box from "@mui/material/Box";

export default {
  title: "RefactoredTimeline/IconControl",
};

export const Basic = () => (
  <Box sx={{ display: "flex", gap: 1, bgcolor: "#222", p: 2, borderRadius: 2 }}>
    <IconControl onClick={() => console.log("Play clicked")} title="Play">
      <Icon icon="play" />
    </IconControl>
    <IconControl onClick={() => console.log("Pause clicked")} title="Pause">
      <Icon icon="pause" />
    </IconControl>
    <IconControl onClick={() => console.log("Refresh clicked")} title="Restart">
      <Icon icon="refresh" />
    </IconControl>
    <IconControl onClick={() => console.log("Step Forward clicked")} title="Step Forward">
      <Icon icon="step-forward" />
    </IconControl>
    <IconControl onClick={() => console.log("Step Backward clicked")} title="Step Backward">
      <Icon icon="step-backward" />
    </IconControl>
  </Box>
); 