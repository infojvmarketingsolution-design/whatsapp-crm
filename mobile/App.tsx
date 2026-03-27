import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { paperTheme } from './src/theme/colors';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <RootNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
