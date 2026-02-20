import React from "react";
import { JsonView } from "react-json-view-lite";
import { type CommunicationLog } from "../../services/SRDriver";
import { Group, Text, Badge, Accordion } from "@mantine/core";

type Props = {
    log: CommunicationLog;
};

export const CommunicationLogDisplay: React.FC<Props> = ({ log }) => {
    // const [expanded, setExpanded] = useState(false);
    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleTimeString();
    };

    const getMethodColor = (method: "ble" | "websocket") => {
        return method === "websocket" ? "blue" : "green";
    };

    const getDirectionColor = (direction: "in" | "out") => {
        return direction === "out" ? "orange" : "cyan";
    };

    const getCommandTypeColor = (
        _commandType: string
    ) => {
        return "green";
    };

    const parsedCommand = JSON.parse(log.command);
    const commandType = parsedCommand.t || parsedCommand.type;

    return (
        <div key={log.id}>
            <Group gap="xs" justify="space-between">
                <Group gap="xs">
                    <Text size="xs" c="dimmed">
                        {formatTimestamp(log.timestamp)}
                    </Text>
                    <Badge size="xs" color={getMethodColor(log.method)}>
                        {log.method.toUpperCase()}
                    </Badge>
                    <Badge size="xs" color={getDirectionColor(log.direction)}>
                        {log.direction.toUpperCase()}
                    </Badge>
                    <Badge size="xs" color={getCommandTypeColor(commandType)}>
                        {commandType}
                    </Badge>
                    {log.extraTags?.map((tag) => (
                        <Badge size="xs" key={tag} color="gray">
                            {tag}
                        </Badge>
                    ))}
                </Group>
                <Badge size="xs" color={log.success ? "green" : "red"}>
                    {log.success ? "SUCCESS" : "ERROR"}
                </Badge>
            </Group>
            <Accordion>
                <Accordion.Item value="command">
                    <Accordion.Control>
                        {commandType}
                    </Accordion.Control>
                    <Accordion.Panel>
                        <JsonView data={JSON.parse(log.command)} />
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
            {/* <JsonView data={JSON.parse(log.command)} /> */}
            {log.error && (
                <Text size="xs" c="red">
                    Error: {log.error}
                </Text>
            )}
            {log.duration && (
                <Text size="xs" c="dimmed">
                    Duration: {log.duration.toFixed(2)}ms
                </Text>
            )}
        </div>
    );
};
