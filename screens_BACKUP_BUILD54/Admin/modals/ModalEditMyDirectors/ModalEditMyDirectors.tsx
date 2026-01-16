import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { StyleModal, StyleZ } from "../../../../assets/css/styles"
import UIModalCloseButton from "../../../../components/UI/UIModal/UIModalCloseButton"
import { BaseColors, BasePaddingsMargins } from "../../../../hooks/Template"
import UIPanel from "../../../../components/UI/UIPanel"
import LFButton from "../../../../components/LoginForms/Button/LFButton"
import ModalAddDirector from "./ModalAddDirector"
import { useState } from "react"
import ModalEditDirectorsDirectorsList from "./ModalEditDirectorsDirectorsList"

export default function ModalEditMyDirectors(

  {
    isOpened,
    F_isOpened,
    onPressAddNewDirector,
    AfterChangeTheDirectors
  }
  :
  {
    isOpened: boolean,
    F_isOpened: (b: boolean)=>void,
    onPressAddNewDirector: ()=>void,
    AfterChangeTheDirectors: ()=>void
  }

){



  const directors = [1,2,3,4];


  return <>
  
  <Modal
      animationType="fade"
      transparent={true}
      visible={isOpened}
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
            StyleModal.scrollView
          ]}>
            
            <View style={[
              StyleModal.contentView
            ]}>
              
              
              {/*<View style={StyleModal.closeButtonContainer}>
                <LFButton type="outline-dark" label="" icon="close" size="small" onPress={()=>{
                  F_isOpened(false)
                }} />
              </View>*/}
              <UIModalCloseButton F_isOpened={F_isOpened} />


              <Text style={[
                StyleZ.h2,
                {
                  color: BaseColors.light,
                  paddingTop: BasePaddingsMargins.m40
                }
              ]}>My Tournament Directors</Text>

              <Text style={[
                StyleZ.p,
                {
                  marginBottom: BasePaddingsMargins.formInputMarginLess
                }
              ]}>
                Tournament directors who can manage tournaments for your venue.
              </Text>

              <ModalEditDirectorsDirectorsList 
                type="remove-director" 
                AfterChangeTheDirectors={
                  ()=>{
                    AfterChangeTheDirectors()
                  }
                }
                />

              <View style={[
                {
                  marginTop: BasePaddingsMargins.loginFormInputHolderMargin
                }
              ]}>
                <LFButton 
                  type="outline-dark" 
                  icon="person-add"
                  label="Add New Tournament Director"

                  onPress={()=>{
                    // set_modalAddDirectorIsOPened(true)
                    onPressAddNewDirector()
                  }}
                   />
              </View>

            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>


    
  </>

}