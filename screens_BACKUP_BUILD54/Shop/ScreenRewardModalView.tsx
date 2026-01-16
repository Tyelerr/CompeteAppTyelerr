import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { StyleModal, StyleZ } from "../../assets/css/styles"
import UIModalCloseButton from "../../components/UI/UIModal/UIModalCloseButton"
import LFButton from "../../components/LoginForms/Button/LFButton"
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template"
import { ICustomContent } from "../../hooks/InterfacesGlobal"
import { Ionicons } from "@expo/vector-icons";

const gift_example_image = require('./../../assets/images/example-gift.jpg');


export default function ScreenRewardsModalView(

  {
    isOpened,
    F_isOpened,
    rewardsData,
    F_AfterPressingEnter,
    // rewardsData
  }
  :
  {
    isOpened: boolean,
    F_isOpened: (b:boolean)=>void,
    rewardsData?: ICustomContent | null,
    F_AfterPressingEnter?: ()=>void,
    // rewardsData: ICustomContent
  }

){

  if(rewardsData===null || rewardsData===undefined){
    return null
  }

  return <Modal
    animationType="fade"
    transparent={true}
    visible={isOpened}
    style={{
      zIndex: 1000
    }}
  >
    <View style={[
        StyleModal.container
      ]}>


      <TouchableOpacity 
        style={[StyleModal.backgroundTouchableForClosing]} 
        onPress={()=>{
        F_isOpened(false)
      }} />

      <View style={[
        StyleModal.containerForScrollingView,
      ]}>


        <ScrollView style={[
          StyleModal.scrollView,
          /*{
            maxHeight: '100%',
            // height: '50%',

            // backgroundColor: 'red'
          }*/
        ]}>

          <View style={[
            StyleModal.contentView,
            {
              paddingBottom: BasePaddingsMargins.m40
            }
          ]}>

            <UIModalCloseButton F_isOpened={F_isOpened} /> 





            <Text style={[
              {
                textAlign: 'center',
                paddingTop: BasePaddingsMargins.m35
              },
              StyleZ.h2,
              {
                marginBottom: BasePaddingsMargins.m10,
                color: BaseColors.light
              }
            ]}>
              {rewardsData?.name}
            </Text>
            <Text style={[
              StyleZ.p,
              {
                textAlign: 'center',
                marginBottom: BasePaddingsMargins.m30
              }
            ]}>Ends 8/15/2025</Text>
            <View style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: BasePaddingsMargins.loginFormInputHolderMargin
            }}>
              <Image source={gift_example_image} style={[
                {
                  width: '100%',
                  height: 100,
                  objectFit: 'contain'
                }
              ]} />
            </View>


            {
              rewardsData!==null?<>
              <View style={
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  marginBottom: BasePaddingsMargins.formInputMarginLess
                }
              }>


                <View>
                  <Text style={
                    [
                      StyleZ.h2,
                      {
                        // color: BaseColors.light,
                        marginBottom: 0
                      }
                    ]
                  }>
                    {rewardsData?.subtitle}
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: BasePaddingsMargins.m10
                  }}>
                    {/*<Ionicons name="location" style={[
                      StyleZ.p,
                      {
                        marginRight: BasePaddingsMargins.m5
                      }
                    ]} />*/}
                    <Text style={[
                      StyleZ.h2,
                      {
                        color: BaseColors.primary
                      }
                    ]}>
                      ${rewardsData?.value} Value
                    </Text>
                  </View>

                  <Text style={[
                    StyleZ.p,
                    {
                      marginBottom: BasePaddingsMargins.formInputMarginLess
                    }
                  ]}>{rewardsData?.description}</Text>

                  <View>
                    <Text style={[
                      StyleZ.h3,
                      {
                        marginBottom: BasePaddingsMargins.m20
                      }
                    ]}>Features:</Text>

                    {
                      rewardsData?.features.split("\n").map((obj, key)=>{
                        return <View 
                          key={`item-${key}`}
                        style={{
                          marginBottom: BasePaddingsMargins.m10,
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          flexDirection: 'row'
                        }}>
                          <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: .5*6,
                            backgroundColor: BaseColors.primary,
                            marginRight: BasePaddingsMargins.m10
                          }} />
                          <Text style={[
                            StyleZ.h5,
                            {
                              marginBottom: 0,
                              width: '95%'
                            }
                          ]}>{obj}</Text>
                        </View>
                      })
                    }
                  </View>

                </View>
              </View>

              <View style={[
                {
                  marginBottom: BasePaddingsMargins.formInputMarginLess
                },
              ]}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}>
                  <Text style={[
                    {
                      marginBottom: BasePaddingsMargins.m10
                    },
                    StyleZ.p,
                    {
                      fontWeight: 'bold',
                      color: BaseColors.light
                    }
                  ]}>Entry Progress</Text>
                  <Text style={[
                    {
                      marginBottom: BasePaddingsMargins.m10
                    },
                    StyleZ.p
                  ]}>{rewardsData?.count_total_entries} / {rewardsData?.entries} entries</Text>
                </View>
                <View style={[
                  {
                    height: 4,
                    position: 'relative',
                    backgroundColor: BaseColors.secondary
                  }
                ]}>
                  <View style={[
                    {
                      width: `${(
                      (rewardsData.count_total_entries)/(rewardsData.entries>0?rewardsData.entries:1)
                    )*100}%`,
                      position: 'absolute',
                      left: 0,
                      height: '100%',
                      backgroundColor: BaseColors.primary
                    }
                  ]} />
                </View>
                <Text style={[
                  StyleZ.p,
                  {
                    marginTop: BasePaddingsMargins.m10,
                    textAlign: 'center',
                  }
                ]}>{
                  Math.round(
                    (
                      (rewardsData.count_total_entries)/(rewardsData.entries>0?rewardsData.entries:1)
                    )*100
                  )
                }% filled • {(rewardsData.entries as number - rewardsData.count_total_entries as number).toString()} spots remaining</Text>
              </View>

              <LFButton type="primary" label="Enter Giveaway" onPress={()=>{
                F_isOpened(false)
                if(F_AfterPressingEnter!==undefined){
                  F_AfterPressingEnter()
                }
              }} />

              </>
              :
              null
            }
            



          </View> 
        
        </ScrollView>
      </View>
    </View>
  </Modal>



}
