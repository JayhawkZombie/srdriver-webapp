import { useState } from 'react';
import { Card, Stack, Text, Slider, Group, Button, ColorInput } from '@mantine/core';
import { IconX, IconPalette } from '@tabler/icons-react';
import { SRDriver } from '../services/SRDriver';

interface DeviceControlsProps {
  srDriver: SRDriver | null;
  onDisconnect: () => void;
}

export const DeviceControls: React.FC<DeviceControlsProps> = ({ srDriver, onDisconnect }) => {
  const [brightness, setBrightness] = useState(128);
  const [color, setColor] = useState('#ffffff');
  const [isLoading, setIsLoading] = useState(false);

  const handleBrightnessChange = async (value: number) => {
    if (!srDriver) return;
    
    try {
      await srDriver.setBrightness(value);
      setBrightness(value);
    } catch (error) {
      console.error('Failed to set brightness:', error);
    }
  };

  const handleShowColorLEDs = async () => {
    if (!srDriver) return;
    
    setIsLoading(true);
    try {
      // Convert hex color to RGB
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Send JSON command to show color LEDs (shortened field names)
      const command = JSON.stringify({
        t: "effect",
        e: {
          t: "solid_color",
          p: {
            c: `rgb(${r},${g},${b})`,
            d: -1
          }
        }
      });
      
      await srDriver.sendCommand(command);
      console.log('✅ Sent color LED command:', command);
    } catch (error) {
      console.error('Failed to send color LED command:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!srDriver) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="dimmed" ta="center">
          No device connected
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Text fw={500}>Device Controls</Text>
          <Button
            variant="light"
            color="red"
            size="xs"
            leftSection={<IconX size={14} />}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </Group>
        
        <Group gap="md" w="100%">
          <Text size="sm" fw={500} w={100}>
            Brightness
          </Text>
          <Slider
            value={brightness}
            onChange={handleBrightnessChange}
            min={0}
            max={255}
            step={1}
            style={{ flex: 1 }}
            size="md"
            color="blue"
            marks={[
              { value: 0, label: '0' },
              { value: 128, label: '128' },
              { value: 255, label: '255' }
            ]}
          />
          <Text size="sm" c="dimmed" w={40}>
            {brightness}
          </Text>
        </Group>

        <Group gap="md" w="100%">
          <Text size="sm" fw={500} w={100}>
            Color
          </Text>
          <ColorInput
            value={color}
            onChange={setColor}
            format="hex"
            style={{ flex: 1 }}
            size="md"
            placeholder="Pick color"
          />
        </Group>

        <Button
          leftSection={<IconPalette size={16} />}
          onClick={handleShowColorLEDs}
          loading={isLoading}
          variant="filled"
          color="blue"
          fullWidth
        >
          {isLoading ? 'Sending...' : 'Show Color LEDs'}
        </Button>
      </Stack>
    </Card>
  );
};
