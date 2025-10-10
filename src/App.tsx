import { Container, Title, Text, Stack, Group, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { ConnectionButton } from './components/ConnectionButton';

const App = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="xl">
        <Group justify="space-between" w="100%">
          <Title order={1} ta="center" style={{ flex: 1 }}>
            SRDriver LED Controller
          </Title>
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
        
        <Text size="lg" c="dimmed" ta="center">
          Connect to your SRDriver device and control LED effects
        </Text>
        
        <ConnectionButton />
      </Stack>
    </Container>
  );
};

export default App;