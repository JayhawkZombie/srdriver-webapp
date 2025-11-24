import React from "react";
import { ScrollArea, Text } from "@mantine/core";
import styles from "./JSONCommandPreview.module.css";
import { JsonView } from "react-json-view-lite";

type Props = {
    command: string;
    isCompact?: boolean;
};

export const JSONCommandPreview: React.FC<Props> = ({ command, isCompact = false }) => {
    return (
        <ScrollArea h={200} className={styles.scrollArea}>
            <Text size="sm" c="dimmed" className={styles.text}>
                {isCompact ? "Compact JSON" : "Full JSON"}
            </Text>
            <Text size="sm" c="dimmed" className={styles.text}>
                <JsonView data={JSON.parse(command)} />
            </Text>
        </ScrollArea>
    );
};
