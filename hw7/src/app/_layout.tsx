import React from 'react';
import { Stack } from 'expo-router';

// basic layout provided by assignment guide.
const Layout = () => (
	<Stack>
		<Stack.Screen name="index" options={{ title: 'Home' }} />
	</Stack>
);

export default Layout;