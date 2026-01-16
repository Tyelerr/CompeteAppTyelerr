import { Animated, Image, Text, TouchableOpacity, View } from "react-native";
import { StyleZ } from "../../assets/css/styles";
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template";
import { tournament_thumb_10_ball, tournament_thumb_8_ball, tournament_thumb_9_ball } from "../../hooks/constants";
import { useEffect, useRef } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

const image1 = tournament_thumb_8_ball;
const image2 = tournament_thumb_9_ball;
const image3 = tournament_thumb_10_ball;



// --- Animation Durations (in milliseconds) ---
const FADE_IN_DURATION = 1000;  // How long it takes for an image to fade in
const HOLD_DURATION = 2000;     // How long an image stays fully visible
const FADE_OUT_DURATION = 1000; // How long it takes for an image to fade out

export default function ScreenBilliardThumb(
  {
    title,
    images,
    routeName,
  }
  :
  {
    title: string,
    images: any[],
    routeName: string
  }
){

  const navigation = useNavigation();
  const route = useRoute();

  /*const images = [
    image1,
    image2,
    image3
  ];*/


  const animatedOpacities = useRef(
    images.slice(1).map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const startAnimation = () => {
      const animationSteps = [];

      // 1. Reset all overlay opacities to 0 before starting a new cycle
      // This ensures a clean fade-in from the base image.
      const resetAnimations = animatedOpacities.map(opacityValue =>
        Animated.timing(opacityValue, { toValue: 0, duration: 0, useNativeDriver: true })
      );
      animationSteps.push(Animated.parallel(resetAnimations));
      animationSteps.push(Animated.delay(100)); // Small delay to ensure reset applies

      // 2. Animate each overlay image sequentially
      animatedOpacities.forEach((opacityValue, index) => {
        animationSteps.push(
          Animated.timing(opacityValue, { toValue: 1, duration: FADE_IN_DURATION, useNativeDriver: true }),
          Animated.delay(HOLD_DURATION),
          Animated.timing(opacityValue, { toValue: 0, duration: FADE_OUT_DURATION, useNativeDriver: true })
        );
      });

      // Start the looped sequence
      Animated.loop(Animated.sequence(animationSteps)).start();
    };

    startAnimation();

    // Cleanup function to stop animations if the component unmounts
    return () => {
      animatedOpacities.forEach(opacityValue => opacityValue.stopAnimation());
    };
  }, []);


  return <TouchableOpacity 
    onPress={()=>{
      // // // // // // // console.log(`route name new to navigate: ${routeName}`);
      navigation.navigate(routeName, {})
    }}
    style={[
    {
      width: '48%',
      display: 'flex',
      marginBottom: BasePaddingsMargins.formInputMarginLess
    }
  ]}>
    <View style={[
      {
        marginBottom: BasePaddingsMargins.m10,
        position: 'relative',
        height: 120,
        borderRadius: BasePaddingsMargins.m10,
        backgroundColor: BaseColors.secondary
      }
    ]}>
      
      {
        images.map((source, key:number)=>{
          if(key===0)
            return <Image 
            key={`the-image-${key}`}
            source={source}
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                borderRadius: BasePaddingsMargins.m10,
              }
            ]} />
          else 
            return <Animated.Image 
            key={`the-image-${key}`}
            source={source}
            style={[
              {
                position: 'absolute',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                borderRadius: BasePaddingsMargins.m10,
              },
              { opacity: animatedOpacities[key-1] }
            ]} />
        })
      }
      


    </View>
    <Text style={[
      StyleZ.h5,
      {
        textAlign: 'center'
      }
    ]}>{title}</Text>
  </TouchableOpacity>
  
}