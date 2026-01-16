import { View } from 'react-native';
import LFButton from '../../LoginForms/Button/LFButton';
import { StyleModal } from '../../../assets/css/styles';

export default function UIModalCloseButton({
  F_isOpened,
}: {
  F_isOpened: (v: boolean) => void;
}) {
  return (
    <View style={[StyleModal.closeButtonContainer]}>
      <LFButton
        type="danger"
        label=""
        icon="close"
        size="small"
        onPress={() => {
          F_isOpened(false);
        }}
      />
    </View>
  );
}
