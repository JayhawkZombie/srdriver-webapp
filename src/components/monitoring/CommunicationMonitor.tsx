import React from "react";
import { Anchor, Group, Progress, Table, Text } from "@mantine/core";
import classes from "./CommunicationMonitor.module.css";
import { SRDriver } from "../../services/SRDriver";


type Props = {
    srDriver: SRDriver | null;
};

export const CommunicationMonitor: React.FC<Props> = ({ srDriver }) => {
    return (
        <div>Communication Monitor</div>
    );
};