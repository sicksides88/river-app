/** Navega a una pantalla del stack raíz (por encima de los tabs). */
export const navigateRoot = (navigation, screen, params) => {
  const state = navigation.getState?.();
  if (state?.routeNames?.includes(screen)) {
    navigation.navigate(screen, params);
    return;
  }

  const root = navigation.getParent()?.getParent();
  if (root?.navigate) {
    root.navigate(screen, params);
    return;
  }
  navigation.navigate(screen, params);
};

export const goBackRoot = (navigation) => {
  if (navigation.canGoBack?.()) {
    navigation.goBack();
  }
};

export const navigateMainTab = (navigation, tab, params) => {
  const payload = params ? { screen: tab, params } : { screen: tab };
  const state = navigation.getState?.();

  if (state?.routeNames?.includes('Main')) {
    navigation.navigate('Main', payload);
    return;
  }

  const root = navigation.getParent()?.getParent();
  if (root?.navigate) {
    root.navigate('Main', payload);
    return;
  }

  navigation.getParent()?.navigate(tab, params);
};
