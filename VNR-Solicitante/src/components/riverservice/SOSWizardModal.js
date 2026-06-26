import React from 'react';
import { Modal } from 'react-native';
import { SOSWizardFlow } from './SOSWizardFlow';

const SOSWizardModal = ({
  visible,
  onClose,
  vessel,
  user,
  onSuccess,
}) => (
  <Modal
    visible={visible}
    animationType="slide"
    presentationStyle="fullScreen"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <SOSWizardFlow
      vessel={vessel}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  </Modal>
);

export default SOSWizardModal;
