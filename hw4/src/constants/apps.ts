// constants for the apps displayed in flatlist

export type IconSet = 'ionicons' | 'material-community';

export type AppItem = {
  id: string;
  label: string;
  message: string;
  iconSet: IconSet;
  iconName: string;
  tint: string;
};

export const APPS = [
  {
    id: 'calls',
    label: 'Calls',
    message: 'Make calls from Here',
    iconSet: 'ionicons',
    iconName: 'call',
    tint: '#34C759',
  },
  {
    id: 'camera',
    label: 'Camera',
    message: 'Welcome to the camera app',
    iconSet: 'ionicons',
    iconName: 'camera',
    tint: '#8E8E93',
  },
  {
    id: 'messages',
    label: 'Messages',
    message: 'Welcome to your Messages',
    iconSet: 'ionicons',
    iconName: 'chatbubble',
    tint: '#34C759',
  },
  {
    id: 'music',
    label: 'Music',
    message: 'Welcome to the Music Selection Screen',
    iconSet: 'ionicons',
    iconName: 'musical-notes',
    tint: '#FA243C',
  },
  {
    id: 'photos',
    label: 'Photos',
    message: 'Welcome to the Photos Screen',
    iconSet: 'ionicons',
    iconName: 'images',
    tint: '#F148A0',
  },
  {
    id: 'discord',
    label: 'Discord',
    message: 'Welcome to your Discord servers',
    iconSet: 'ionicons',
    iconName: 'logo-discord',
    tint: '#5865F2',
  },
  {
    id: 'slack',
    label: 'Slack',
    message: 'Welcome to your Slack workspace',
    iconSet: 'ionicons',
    iconName: 'logo-slack',
    tint: '#4A154B',
  },
  {
    id: 'teams',
    label: 'Teams',
    message: 'Welcome to Microsoft Teams',
    iconSet: 'material-community',
    iconName: 'microsoft-teams',
    tint: '#464EB8',
  },
] as const satisfies readonly AppItem[];
