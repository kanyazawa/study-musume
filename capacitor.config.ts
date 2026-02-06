import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.studymusume.app',
    appName: 'Study Musume',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
