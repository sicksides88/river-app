import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/theme';

// Contenido de términos para usuarios
const USER_TERMS = {
  title: 'Términos y Condiciones de Uso',
  lastUpdated: '15 de enero de 2025',
  sections: [
    {
      title: '1. Aceptación de los Términos',
      content: `Al acceder y utilizar la aplicación VNR ("la Aplicación"), usted acepta estar sujeto a estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.

La Aplicación es operada por VNR S.A. ("nosotros", "nos" o "nuestro"). Nos reservamos el derecho de modificar estos términos en cualquier momento, y dichas modificaciones entrarán en vigor inmediatamente después de su publicación en la Aplicación.`,
    },
    {
      title: '2. Descripción del Servicio',
      content: `VNR es una plataforma tecnológica que conecta usuarios con proveedores de servicios de transporte y logística, incluyendo:

• Vuelta Segura: Servicio de transporte de pasajeros
• Envíos: Servicio de mensajería y paquetería
• Fletes: Servicio de transporte de carga
• Chofer: Servicio de conductor privado

VNR actúa únicamente como intermediario tecnológico entre usuarios y prestadores de servicios independientes.`,
    },
    {
      title: '3. Registro y Cuenta de Usuario',
      content: `Para utilizar los servicios de VNR, debe:

• Ser mayor de 18 años
• Proporcionar información veraz, precisa y completa
• Mantener la confidencialidad de su contraseña
• Notificar inmediatamente cualquier uso no autorizado de su cuenta

Usted es responsable de todas las actividades que ocurran bajo su cuenta. VNR se reserva el derecho de suspender o cancelar cuentas que violen estos términos.`,
    },
    {
      title: '4. Uso del Servicio',
      content: `Al utilizar VNR, usted se compromete a:

• No utilizar el servicio para fines ilegales
• No transportar sustancias prohibidas o peligrosas
• Tratar con respeto a los conductores y cadetes
• Proporcionar información precisa sobre ubicaciones y destinos
• Realizar el pago correspondiente por los servicios utilizados
• No compartir su cuenta con terceros`,
    },
    {
      title: '5. Tarifas y Pagos',
      content: `Las tarifas de los servicios se calculan en base a:

• Distancia del recorrido
• Tiempo estimado del servicio
• Tipo de servicio solicitado
• Demanda en tiempo real

Los precios mostrados son estimados y pueden variar. El pago puede realizarse en efectivo o mediante los métodos de pago habilitados en la Aplicación. VNR puede cobrar una comisión por el uso de la plataforma.`,
    },
    {
      title: '6. Cancelaciones',
      content: `Usted puede cancelar un servicio solicitado antes de que el conductor/cadete llegue al punto de recogida. Las cancelaciones frecuentes o después de la llegada del prestador pueden resultar en cargos adicionales o restricciones en su cuenta.`,
    },
    {
      title: '7. Limitación de Responsabilidad',
      content: `VNR no es responsable por:

• Daños o pérdidas de objetos transportados
• Lesiones personales durante el servicio
• Retrasos causados por factores externos
• Acciones de los prestadores de servicios independientes

VNR actúa como intermediario tecnológico y no es empleador ni contratista de los conductores y cadetes registrados en la plataforma.`,
    },
    {
      title: '8. Privacidad y Datos Personales',
      content: `Sus datos personales serán tratados conforme a nuestra Política de Privacidad. Al aceptar estos términos, usted autoriza:

• La recolección de datos de ubicación durante el uso del servicio
• El almacenamiento de información de contacto y perfil
• El procesamiento de datos para mejorar el servicio
• La comunicación de ofertas y novedades (puede desactivarse)`,
    },
    {
      title: '9. Propiedad Intelectual',
      content: `Todos los derechos de propiedad intelectual de la Aplicación, incluyendo marcas, logos, diseños y código fuente, pertenecen a VNR S.A. Queda prohibida la reproducción, distribución o modificación sin autorización expresa.`,
    },
    {
      title: '10. Contacto',
      content: `Para consultas sobre estos términos, puede contactarnos a:

• Email: soporte@vnr.com.ar
• Teléfono: +54 11 XXXX-XXXX
• Dirección: [Dirección de la empresa]`,
    },
  ],
};

// Contenido de términos para conductores/prestadores
const DRIVER_TERMS = {
  title: 'Términos y Condiciones para Prestadores de Servicios',
  lastUpdated: '15 de enero de 2025',
  sections: [
    {
      title: '1. Naturaleza de la Relación',
      content: `Al registrarse como prestador de servicios en VNR ("la Plataforma"), usted reconoce y acepta que:

• Actúa como trabajador independiente y autónomo
• No existe relación laboral entre usted y VNR
• VNR es únicamente un intermediario tecnológico
• Usted es responsable de sus obligaciones fiscales y previsionales
• Tiene libertad para aceptar o rechazar servicios
• Puede prestar servicios en otras plataformas simultáneamente`,
    },
    {
      title: '2. Requisitos para Prestadores',
      content: `Para registrarse como prestador en VNR debe:

• Ser mayor de 21 años
• Poseer licencia de conducir vigente (categoría correspondiente)
• Contar con seguro de responsabilidad civil vigente
• Tener el vehículo en condiciones óptimas de funcionamiento
• No tener antecedentes penales
• Aprobar las verificaciones de seguridad de VNR

Para servicios de Flete y Envíos:
• Poseer vehículo adecuado para carga
• Cumplir con las normativas de transporte de mercancías

Para servicios de Vuelta Segura y Chofer:
• Vehículo con antigüedad máxima de 10 años
• Cumplir con requisitos de transporte de pasajeros`,
    },
    {
      title: '3. Obligaciones del Prestador',
      content: `Como prestador de servicios, usted se compromete a:

• Mantener documentación actualizada en la Plataforma
• Cumplir con todas las normas de tránsito
• Brindar un servicio profesional y respetuoso
• Mantener el vehículo limpio y en buen estado
• No consumir alcohol ni sustancias antes o durante el servicio
• Respetar las rutas y tarifas establecidas
• Entregar los paquetes/pasajeros en las condiciones acordadas
• Utilizar la aplicación de conductor durante los servicios
• Reportar cualquier incidente inmediatamente`,
    },
    {
      title: '4. Tarifas y Comisiones',
      content: `El esquema de pagos funciona de la siguiente manera:

• Las tarifas son establecidas por VNR según el tipo de servicio
• VNR retiene una comisión del [X]% por cada servicio completado
• Los pagos se liquidan semanalmente
• Puede retirar sus ganancias a través de los métodos habilitados
• VNR puede modificar las tarifas y comisiones con previo aviso

Bonificaciones e incentivos:
• VNR puede ofrecer bonos por objetivos cumplidos
• Los incentivos están sujetos a términos específicos
• VNR se reserva el derecho de modificar programas de incentivos`,
    },
    {
      title: '5. Seguros y Responsabilidad',
      content: `Requisitos de seguro:

• Debe mantener seguro de responsabilidad civil vigente
• El seguro debe cubrir daños a terceros y pasajeros
• Para fletes, debe contar con seguro de carga
• VNR puede solicitar comprobantes de seguro en cualquier momento

Responsabilidad:
• Usted es responsable por daños causados durante el servicio
• Debe indemnizar a VNR por reclamos derivados de su actuación
• VNR no cubre pérdidas o daños de mercancía transportada
• Debe reportar accidentes dentro de las 24 horas`,
    },
    {
      title: '6. Calificaciones y Desempeño',
      content: `Sistema de evaluación:

• Los usuarios califican cada servicio de 1 a 5 estrellas
• Su calificación promedio es visible para los usuarios
• Una calificación baja puede resultar en restricciones
• VNR puede desactivar cuentas con calificación inferior a 4.0

Causales de suspensión o baja:
• Calificación promedio inferior a 4.0
• Denuncias graves por parte de usuarios
• Incumplimiento de estos términos
• Documentación vencida o falsa
• Conducta inapropiada o delictiva`,
    },
    {
      title: '7. Uso de la Plataforma',
      content: `Al usar la plataforma de conductor, usted acepta:

• Mantener la aplicación activa durante los servicios
• No compartir su cuenta con terceros
• No manipular el GPS o la ubicación
• No aceptar servicios fuera de la plataforma
• Respetar la privacidad de los usuarios
• No contactar usuarios fuera del contexto del servicio`,
    },
    {
      title: '8. Propiedad Intelectual y Confidencialidad',
      content: `Usted reconoce que:

• Toda la información de usuarios es confidencial
• No puede utilizar datos de usuarios para fines propios
• La marca VNR y sus elementos son propiedad exclusiva de VNR
• No puede usar la marca sin autorización expresa
• Al finalizar la relación, debe cesar todo uso de la marca`,
    },
    {
      title: '9. Terminación',
      content: `La relación puede terminar:

• Por decisión voluntaria suya en cualquier momento
• Por decisión de VNR con causa justificada
• Por incumplimiento grave de estos términos
• Por inactividad prolongada (más de 90 días)

Al terminar la relación:
• Se liquidarán los saldos pendientes
• Deberá devolver cualquier material de VNR
• Cesará el acceso a la plataforma de conductor`,
    },
    {
      title: '10. Disposiciones Fiscales',
      content: `Como trabajador independiente:

• Es responsable de su inscripción ante AFIP
• Debe emitir facturas o recibos según corresponda
• VNR puede retener impuestos según normativa vigente
• Debe mantener su situación fiscal regularizada
• VNR proporcionará información fiscal requerida por ley`,
    },
    {
      title: '11. Contacto y Soporte',
      content: `Para consultas sobre estos términos o soporte:

• Email: conductores@vnr.com.ar
• Teléfono: +54 11 XXXX-XXXX
• Soporte en la app: Sección "Ayuda"

Horario de atención: Lunes a Viernes de 9:00 a 18:00 hs`,
    },
  ],
};

const TermsAndConditionsModal = ({
  visible,
  onClose,
  onAccept,
  type = 'user', // 'user' | 'driver'
}) => {
  const terms = type === 'driver' ? DRIVER_TERMS : USER_TERMS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Términos y Condiciones</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Title */}
          <Text style={styles.title}>{terms.title}</Text>
          <Text style={styles.lastUpdated}>
            Última actualización: {terms.lastUpdated}
          </Text>

          {/* Sections */}
          {terms.sections.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionContent}>{section.content}</Text>
            </View>
          ))}

          {/* Footer note */}
          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.textMuted} />
            <Text style={styles.footerNoteText}>
              Al aceptar estos términos, usted confirma que ha leído, entendido y acepta
              estar sujeto a todas las disposiciones contenidas en este documento.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom buttons */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.declineButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={onAccept}
            activeOpacity={0.8}
          >
            <Text style={styles.acceptButtonText}>Aceptar Términos</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: SIZES.subtitle,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.screenPadding,
    paddingVertical: SIZES.lg,
    paddingBottom: SIZES.xxl,
  },
  title: {
    fontSize: SIZES.h3,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  lastUpdated: {
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    marginBottom: SIZES.xl,
  },
  section: {
    marginBottom: SIZES.xl,
  },
  sectionTitle: {
    fontSize: SIZES.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SIZES.sm,
  },
  sectionContent: {
    fontSize: SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  footerNote: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundInput,
    padding: SIZES.md,
    borderRadius: SIZES.radius,
    marginTop: SIZES.lg,
    gap: SIZES.sm,
  },
  footerNoteText: {
    flex: 1,
    fontSize: SIZES.small,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  bottomContainer: {
    flexDirection: 'row',
    padding: SIZES.screenPadding,
    paddingBottom: SIZES.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
    gap: SIZES.md,
  },
  declineButton: {
    flex: 1,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  acceptButton: {
    flex: 2,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusFull,
    backgroundColor: COLORS.text,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: SIZES.body,
    fontWeight: '600',
    color: COLORS.white,
  },
});

export default TermsAndConditionsModal;
