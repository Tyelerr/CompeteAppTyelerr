import { Text, View } from 'react-native';
// import RnRangeSlider from "rn-range-slider";
import ZSliderRange from './ZSliderRange';
import ZSliderSingle from './ZSliderSingle';
import { StyleSlider } from '../../../assets/css/styles';
// import SliderCustomRange from "./SliderCustomRange";

export default function ZSlider({
  type,

  label,
  valueTemplate,
  measurementTemplates,
  templateValuesMinMax,

  min,
  max,
  initialValue,

  valueLeft,
  valueRight,

  step,

  onValueChange,
  onValueChangeRange,
  onSlidingComplete,

  marginBottom,
}: {
  type: 'single' | 'range';

  label: string;
  //valueTemplate should be like value {v} where after {v} will change to the value
  valueTemplate?: string;
  measurementTemplates: string[];
  templateValuesMinMax?: string;

  min: number;
  max: number;
  initialValue?: number;

  valueLeft?: number;
  valueRight?: number;

  // works only for range slider
  step?: number;

  onValueChange?: (v: number) => void;
  onValueChangeRange?: (vl: number, vr: number) => void;
  onSlidingComplete?: (v: number) => void;

  marginBottom?: number;
}) {
  return (
    <View
      style={[
        StyleSlider.container_main,
        {
          marginBottom:
            marginBottom !== undefined
              ? marginBottom
              : StyleSlider.container_main.marginBottom,
        },
      ]}
    >
      {/*from to slider*/}

      {/*<ZSliderRange />*/}
      {type === 'single' ? (
        <ZSliderSingle
          label={label}
          valueTemplate={valueTemplate as string}
          // measurementTemplates={['{v} mile', '{v} miles']}
          measurementTemplates={measurementTemplates}
          initialValue={initialValue as number}
          min={min}
          max={max}
          onValueChange={(v: number) => {
            if (onValueChange !== undefined) {
              onValueChange(v);
            }
          }}
          onSlidingComplete={(v: number) => {
            if (onSlidingComplete !== undefined) {
              onSlidingComplete(v);
            }
          }}
        />
      ) : (
        /*<ZSliderRange 
          min={min}
          max={max}
          label={label}
          step={step as number}
        />*/
        <View>
          {/*<SliderCustomRange
            label={label}
            step={step as number}
            min={min}
            max={max}
          />*/}

          <ZSliderRange
            label={label}
            step={step as number}
            min={min}
            max={max}
            valueLeft={valueLeft}
            valueRight={valueRight}
            measurementTemplates={measurementTemplates}
            templateValuesMinMax={templateValuesMinMax as string}
            onValueChange={onValueChangeRange}
          />
        </View>
      )}
    </View>
  );
}
