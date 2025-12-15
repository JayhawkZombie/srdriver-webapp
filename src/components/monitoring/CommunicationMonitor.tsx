import { Card, Stack, Text, Group, Badge, ScrollArea } from '@mantine/core';
import { useDeviceContext } from '../../contexts/DeviceContext';
import { CommunicationLogDisplay } from './CommunicationLogDisplay';

export const CommunicationMonitor = () => {
  const { communicationLogs, clearLogs } = useDeviceContext();



  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Communication Monitor ({communicationLogs.length})</Text>
          <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={clearLogs}>
            Clear Logs
          </Text>
        </Group>
        
        <ScrollArea h={300}>
          {communicationLogs.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center">
              No communication logs yet. Connect to a device and start controlling it.
            </Text>
          ) : (
            <Stack gap="xs">
              {communicationLogs.slice(-50).reverse().map((log) => (
                <CommunicationLogDisplay key={log.id} log={log} />
                // <div key={log.id}>
                //   <Group gap="xs" justify="space-between">
                //     <Group gap="xs">
                //       <Text size="xs" c="dimmed">
                //         {formatTimestamp(log.timestamp)}
                //       </Text>
                //       <Badge size="xs" color={getMethodColor(log.method)}>
                //         {log.method.toUpperCase()}
                //       </Badge>
                //       <Badge size="xs" color={getDirectionColor(log.direction)}>
                //         {log.direction.toUpperCase()}
                //       </Badge>
                //       {log.extraTags?.map((tag) => (
                //         <Badge size="xs" key={tag} color="gray">
                //           {tag}
                //         </Badge>
                //       ))}
                //     </Group>
                //     <Badge size="xs" color={log.success ? 'green' : 'red'}>
                //       {log.success ? 'SUCCESS' : 'ERROR'}
                //     </Badge>
                //   </Group>
                //   {/* <Text size="sm" style={{ fontFamily: 'monospace' }}>
                //     {log.command}
                //   </Text> */}
                //   <JsonView data={JSON.parse(log.command)} />
                //   {log.error && (
                //     <Text size="xs" c="red">
                //       Error: {log.error}
                //     </Text>
                //   )}
                //   {log.duration && (
                //     <Text size="xs" c="dimmed">
                //       Duration: {log.duration.toFixed(2)}ms
                //     </Text>
                //   )}
                // </div>
              ))}
            </Stack>
          )}
        </ScrollArea>
      </Stack>
    </Card>
  );
};