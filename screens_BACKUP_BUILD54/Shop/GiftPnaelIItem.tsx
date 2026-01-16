import { Image, Text, View } from "react-native";
import UIPanel from "../../components/UI/UIPanel";
import { Ionicons } from "@expo/vector-icons";
import { BaseColors, BasePaddingsMargins, TextsSizes } from "../../hooks/Template";
import UIBadge from "../../components/UI/UIBadge";
import { EUserRole, ICAUserData, ICustomContent } from "../../hooks/InterfacesGlobal";
import { useContextAuth } from "../../context/ContextAuth";
import LFButton from "../../components/LoginForms/Button/LFButton";
import { StyleZ } from "../../assets/css/styles";
import ModalInfoMessage from "../../components/UI/UIModal/ModalInfoMessage";
import { useState } from "react";
import { DeleteContent } from "../../ApiSupabase/CrudCustomContent";
const gift_example_image = require('./../../assets/images/example-gift.jpg');

export default function GiftPanelItem(
  {
    afterClickingEditButton,
    rewardsData,
    AfterClickingViewDetails,
    afterDeletingTheGift
  }
  :
  {
    afterClickingEditButton: (content: ICustomContent)=>void,
    rewardsData: ICustomContent,
    AfterClickingViewDetails: (content: ICustomContent)=>void,
    afterDeletingTheGift?: ()=>void
  }
){
  
  const {
    user
  } = useContextAuth();

  const [messageForAskingForDeletingOpened, set_messageForAskingForDeletingOpened] = useState<boolean>(false);

  const ___DeleteTheGift = async ()=>{
    const {isDeleted, error, data} = await DeleteContent( rewardsData.id );
    // // // console.log(error, data);
    set_messageForAskingForDeletingOpened(false)
    if(afterDeletingTheGift!==undefined){
      afterDeletingTheGift()
    }
  }

  let rewardsPictureProps = {}
  if(rewardsData.reward_picture!=='' && rewardsData.reward_picture!==null && rewardsData.reward_picture!==undefined){
    rewardsPictureProps={
      source: {
        uri: rewardsData.reward_picture
      }
    }
  }
  else{
    rewardsPictureProps = {
      source:{gift_example_image} 
    }
  }

  return <>
  <UIPanel>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: BasePaddingsMargins.formInputMarginLess
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center'
        }}>
          <Ionicons name="gift" style={{
            fontSize: TextsSizes.p,
            color: BaseColors.primary,
            marginRight: BasePaddingsMargins.m10
          }} />
          <UIBadge label={`Reward - ID:${rewardsData.id}`} type="primary-outline" />
        </View>
        {
          user!==null && (user as ICAUserData).role === EUserRole.MasterAdministrator
          ?
          <View style={{
            width: 120,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View style={{
              width: 40
            }}>
              <LFButton icon="trash" size="small" type="danger" onPress={()=>{
              // afterClickingEditButton(true);
              set_messageForAskingForDeletingOpened(true);
            }} />
            </View>
            <View style={{width: 70}}>
              <LFButton icon="pencil" size="small" label="Edit" type="primary" onPress={()=>{
              afterClickingEditButton(rewardsData);
            }} />
            </View>
          </View>
          :
          null
        }
        
      </View>

      
      <View style={{
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: BasePaddingsMargins.loginFormInputHolderMargin
      }}>
        <Image 
          {...rewardsPictureProps}
          // source={}
          style={[
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
              {rewardsData.subtitle}
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              {/*<Ionicons name="location" style={[
                StyleZ.p,
                {
                  marginRight: BasePaddingsMargins.m5
                }
              ]} />*/}
              <Text style={[
                StyleZ.p
              ]}>
                ${rewardsData.value} Value
              </Text>
            </View>
          </View>
        </View>

        <View style={[
          {
            marginBottom: BasePaddingsMargins.formInputMarginLess
          },
        ]}>
          <Text style={[
            {
              marginBottom: BasePaddingsMargins.m10
            },
            StyleZ.p
          ]}>{rewardsData.count_total_entries} / {rewardsData.entries} entries</Text>
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
            ]}></View>
          </View>
        </View>

        <LFButton type="primary" label="View Details" onPress={()=>{
          AfterClickingViewDetails( rewardsData )
        }} />


        {
          /*<View style={{
          marginBottom: BasePaddingsMargins.formInputMarginLess
        }}>
          <Text style={[
            StyleZ.h4,
            {
              fontWeight: 'normal'
            }
          ]}>{theData().description}</Text>
        </View>*/
        }
        



        </>
        :
        null
      }
      

    </UIPanel>

    {
      messageForAskingForDeletingOpened===true?
      <ModalInfoMessage 
        id={666}
        title="Deleting Gift"
        message="Are you sure you want to delete this gift? This action cannot be undone."
        visible={messageForAskingForDeletingOpened}
        set_visible={set_messageForAskingForDeletingOpened}
        buttons={[
          <LFButton label="Cancel" type="outline-dark" onPress={()=>{
            set_messageForAskingForDeletingOpened(false)
          }} />,
          <LFButton label="Delete the gift" type="danger" onPress={()=>{
            set_messageForAskingForDeletingOpened(false)
            ___DeleteTheGift()
          }} />
        ]}
        
      />
      :
      null
    }
    

    </>
}