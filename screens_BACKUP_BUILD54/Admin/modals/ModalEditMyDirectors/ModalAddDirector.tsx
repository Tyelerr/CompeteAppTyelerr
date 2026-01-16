import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native"
import { StyleModal, StyleZ } from "../../../../assets/css/styles"
import UIModalCloseButton from "../../../../components/UI/UIModal/UIModalCloseButton"
import { BaseColors, BasePaddingsMargins } from "../../../../hooks/Template"
import UIPanel from "../../../../components/UI/UIPanel"
import LFButton from "../../../../components/LoginForms/Button/LFButton"
import { useEffect, useState } from "react"
import { ICAUserData } from "../../../../hooks/InterfacesGlobal"
import { FetchPotentialDirectors } from "../../../../ApiSupabase/CrudUser"
import { useContextAuth } from "../../../../context/ContextAuth"
import ModalEditDirectorsDirectorsList from "./ModalEditDirectorsDirectorsList"

export default function ModalAddDirector(

  {
    isOpened,
    F_isOpened,
    AfterChangeTheDirectors
  }
  :
  {
    isOpened: boolean,
    F_isOpened: (b: boolean)=>void,
    AfterChangeTheDirectors: ()=>void
  }

){

  // const directors = [1,2,3,4];


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
              ]}>Add Director</Text>

              <Text style={[
                StyleZ.p,
                {
                  marginBottom: BasePaddingsMargins.formInputMarginLess
                }
              ]}>
                Add Director Form
              </Text>


              <ModalEditDirectorsDirectorsList 
                type="add-director"
                AfterChangeTheDirectors={()=>{
                  AfterChangeTheDirectors()
                }}
                />


            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  </>

}