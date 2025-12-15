import { Container, Title, Text, Stack, Group, ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconSun, IconMoon } from '@tabler/icons-react';
import { AppStateProvider } from './contexts/AppStateProvider';
import { DeviceProvider } from './contexts/DeviceContext';
import { ConnectionButton } from './components/ConnectionButton';
import AppStoreDisplay from './stores/AppStoreDisplay';
import AppInfoViews from './components/AppInfoViews';

const App = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
      <AppStateProvider>
          <DeviceProvider>
              <Container size="md" py="xl">
                  <Group justify="space-between" w="100%" wrap="nowrap" miw={20} align="flex-start">
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
                                  {colorScheme === "dark" ? (
                                      <IconSun size={18} />
                                  ) : (
                                      <IconMoon size={18} />
                                  )}
                              </ActionIcon>
                          </Group>

                          <Text size="lg" c="dimmed" ta="center">
                              Connect to your SRDriver device and control LED
                              effects
                          </Text>

                          <ConnectionButton />
                      </Stack>
                  <AppInfoViews />
                  </Group>
                  {/* <AppStoreDisplay /> */}
              </Container>
          </DeviceProvider>
      </AppStateProvider>
  );
};

export default App;