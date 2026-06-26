import React from 'react';
import DriverScheduleScreen from '../driver/schedule/DriverScheduleScreen';

const RiderScheduleScreen = (props) => (
  <DriverScheduleScreen {...props} route={{ ...props.route, params: { ...props.route?.params, serviceType: 'auxilio' } }} />
);

export default RiderScheduleScreen;
