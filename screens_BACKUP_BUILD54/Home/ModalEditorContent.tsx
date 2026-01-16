import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import UIModalCloseButton from "../../components/UI/UIModal/UIModalCloseButton";
import { StyleModal } from "../../assets/css/styles";
import LFInput from "../../components/LoginForms/LFInput";
import LFInputsGrid, { ILFInputGridInput } from "../../components/LoginForms/LFInputsGrid";
import { useEffect, useState } from "react";
import LFButton from "../../components/LoginForms/Button/LFButton";
import { InsertContent } from "../../ApiSupabase/CrudCustomContent";
import { ECustomContentType, ICustomContent } from "../../hooks/InterfacesGlobal";
import AttachImage from "../../components/UI/Attach/AttachImage";
import { BaseColors, BasePaddingsMargins, TextsSizes } from "../../hooks/Template";
// import AttachImage from "../../components/UI/Attach/AttachImage";
// import AttachImageSingle from "../../components/LoginForms/Attach/AttachImageSingle";

export default function ModalEditorContent(

  {
    isOpened,
    F_isOpened,
    type,
    data_row,
    set_data_row
  }
  :
  {
    isOpened: boolean,
    F_isOpened: (b: boolean)=>void,
    type:ECustomContentType,
    data_row: ICustomContent | null,
    set_data_row: (cc:ICustomContent)=>void
  }

){

  const [name, set_name] = useState<string>('');
  const [label_about_the_person, set_label_about_the_person] = useState<string>('');
  const [address, set_address] = useState<string>('');
  const [description, set_description] = useState<string>('');

  const [list, set_list] = useState<ILFInputGridInput[][]>([]);
  const [labels, set_labels] = useState<ILFInputGridInput[][]>([]);

  const [phone_number, set_phone_number] = useState<string>('');

  const [reward_picture, set_reward_picture] = useState<string>('');
  const [reward_link, set_reward_link] = useState<string>('');

  const [loading, set_loading] = useState<boolean>(false);



  const ___UpdateTheContent = async ()=>{

    set_loading(true);
    const newContent: ICustomContent = {
      type: type,
      name: name,
      label_about_the_person: label_about_the_person,
      address: address,
      description: description,
      list: list,
      labels: labels,
      phone_number: phone_number
    } as ICustomContent;

    const {
      data, error
    } = await InsertContent( newContent );
    set_data_row( newContent );

    set_loading(false);
  }

  
  useEffect(()=>{
    if(data_row!==null){
      const dataFor:ICustomContent = data_row as ICustomContent;
      set_name( dataFor.name );
      set_label_about_the_person( dataFor.label_about_the_person );
      set_address( dataFor.address );
      set_description( dataFor.description );
      set_list( dataFor.list );
      set_labels( dataFor.labels );
      set_phone_number( dataFor.phone_number );

      set_reward_picture( dataFor.reward_picture );
      set_reward_link( dataFor.reward_link );
    }
  }, [ isOpened ]);

  return <Modal
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
            StyleModal.scrollView,
            /*{
              maxHeight: '100%',
              // height: '50%',
  
              // backgroundColor: 'red'
            }*/
          ]}>

            <View style={[
              StyleModal.contentView
            ]}>
  
              <UIModalCloseButton F_isOpened={F_isOpened} />


              <View style={[
                StyleModal.headingContainer
              ]}>
                <Text style={[
                  StyleModal.heading
                ]}>Content Editor</Text>
              </View>

              <LFInput label="Name" placeholder="Enter Name" value={name} onChangeText={set_name} />
              <LFInput label="Label Hero About" placeholder="Enter Hero Label" value={label_about_the_person} onChangeText={set_label_about_the_person} />
              <LFInput label="Address" placeholder="Enter Address" value={address} onChangeText={set_address} />
              <LFInput label="Description" placeholder="Enter Description" typeInput="textarea" value={description} onChangeText={set_description} />

              {
                type===ECustomContentType.ContentRewards?
                <>
                  <LFInput label="Reward Photo" placeholder="Enter Reward Photo" value={reward_picture} onChangeText={set_reward_picture} />
                  {
                  // <AttachImageSingle />
                  }
                  <Text style={{
                                color: BaseColors.othertexts,
                                // backgroundColor: 'red',
                                fontSize: TextsSizes.p,
                                marginBottom: BasePaddingsMargins.m5
                              }}>
                    Reward Picture    
                  </Text>
                  <AttachImage 
                    // set_thumbnailType={}
                    set_thumbnailType={(t:string)=>{}}
                    set_thumbnail_url={set_reward_picture}
                    defaultUrl={reward_picture}
                  />
                  <LFInput iconFront="link" label="Reward Link" placeholder="Enter Reward Link" value={reward_link} onChangeText={set_reward_link} />
                </>
                :
                null
              }

              
              <LFInputsGrid 
                label="List Items" 
                labelAdd="Add Item"
                inputs={[
                  {label:"Text Item", placeholder: 'Enter Item Text'},
                ]}
                rows_data={list}
                set_rows_data={set_list}
                />


              <LFInputsGrid 
                label="List Labels" 
                labelAdd="Add Label"
                inputs={[
                  {label:"Text Label", placeholder: 'Enter Label Text'},
                ]}
                rows_data={labels}
                set_rows_data={set_labels}
                />

              <LFInput label="Phone Number" placeholder="Enter Phone Number" keyboardType="phone-pad" value={phone_number} onChangeText={set_phone_number} />


              <LFButton 
                loading={loading}
                label="Update The Content" type="primary" onPress={()=>{
                ___UpdateTheContent()
              }} />


            </View>
            </ScrollView>
            </View>
            </View>
            </Modal>
}