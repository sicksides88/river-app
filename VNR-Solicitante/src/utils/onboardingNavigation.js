import { membershipService } from '../services';

/**
 * Tras cargar embarcación en onboarding:
 * - Guardó datos → datos de socio (independiente por defecto)
 * - Agregar después → elegir vínculo (aseguradora / independiente)
 */
export async function navigateAfterEmbarcacion(navigation, { skipped = false } = {}) {
  if (skipped) {
    navigation.navigate('OnboardingLinkType');
    return;
  }

  try {
    const { membership } = await membershipService.getMembership();
    if (membership?.link_type === 'aseguradora') {
      navigation.navigate('OnboardingAseguradora');
      return;
    }
  } catch {
    // continuar con flujo independiente por defecto
  }

  try {
    await membershipService.setLinkType('independiente');
  } catch {
    // si falla, igual intentamos la pantalla de datos
  }

  navigation.navigate('OnboardingIndependiente');
}

export function getMembershipScreen(linkType) {
  if (linkType === 'aseguradora') return 'OnboardingAseguradora';
  return 'OnboardingIndependiente';
}
