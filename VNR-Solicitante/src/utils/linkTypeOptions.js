export const LINK_TYPE_OPTIONS = [
  {
    id: 'aseguradora',
    title: 'Vía aseguradora',
    subtitle: 'Cobertura a través de una compañía asociada',
    detail:
      'Pedimos los datos de tu póliza (obligatoria). Tu aseguradora valida la cobertura.',
    icon: 'shield-checkmark-outline',
    next: 'OnboardingAseguradora',
  },
  {
    id: 'independiente',
    title: 'Asociación independiente',
    subtitle: 'Te asociás directamente con River Service',
    detail:
      'Pedimos tus datos personales y bancarios para débito de cuota mensual.',
    icon: 'person-add-outline',
    next: 'OnboardingIndependiente',
  },
];

export const LINK_TYPE_ONBOARDING_INTRO =
  'Elegí el tipo de vínculo con River Service. Podés cambiarlo después desde tu perfil.';

export const LINK_TYPE_ONBOARDING_FOOTER =
  'Esta info es necesaria para que el operador pueda autorizar tus pedidos de auxilio.';

export const LINK_TYPE_PROFILE_FOOTER =
  'Si cambiás a Vía aseguradora, la póliza pasa a ser un dato obligatorio. Como independiente, no se requiere.';

export const getProfileLinkTypeIntro = (linkType) => {
  if (linkType === 'aseguradora') {
    return 'Estás asociado vía aseguradora. Podés cambiar tu tipo de vínculo cuando quieras.';
  }
  return 'Estás asociado de forma independiente. Podés cambiar tu tipo de vínculo cuando quieras.';
};

export const normalizeLinkType = (value) =>
  value === 'aseguradora' ? 'aseguradora' : 'independiente';
