import { StyleProp, Text, View, ViewStyle } from "react-native";
import UIPanel from "../../../../components/UI/UIPanel";
import { ICAUserData } from "../../../../hooks/InterfacesGlobal";
import { BaseColors, BasePaddingsMargins } from "../../../../hooks/Template";
import { StyleZ } from "../../../../assets/css/styles";
import LFButton from "../../../../components/LoginForms/Button/LFButton";

export default function ItemDirectorAddRemove(
  {
    director,
    style,
    type,
    ___AddDirector,
    ids_adding_director,
    set_ids_adding_director,
    AfterChangeTheDirectors,
    ids_removed_directors,
    set_showQuestionMessage,
    set_directorForRemoving
  }
  :
  {
    director: ICAUserData,
    style?: StyleProp<ViewStyle>,
    type: 'add-director' | 'remove-director',
    ___AddDirector: (userIdThatNeedPermission:number)=>void,
    ids_adding_director: number[],
    set_ids_adding_director: (ids:number[])=>void,
    AfterChangeTheDirectors: ()=>void,
    ids_removed_directors: number[],
    set_showQuestionMessage: (b:boolean)=>void,
    set_directorForRemoving: (director: ICAUserData)=>void
  }
){

  
  const DirectorName = (director: ICAUserData)=>{
    return (

      director.name!=='' && director.name!==null && director.name!==undefined?
                          `${director.name}`
                          :
                          director.email.split('@')[0]

    );
  }
  const DirectorInitials = (director: ICAUserData)=>{
    const _name:string = DirectorName(director);
    return `${_name.split(' ')[0][0]}${_name.split(' ')[1]!==undefined?_name.split(' ')[1][0]:''}`.toUpperCase();
  }

  return <UIPanel style={[
    /*(
      key===directors.length-1?
      {
        marginBottom: 0
      }
      :
      {}
    )*/
   (style!==undefined?style:{})
  ]}>
    <View style={[
      {
        // flexDirection: 'row',
        // justifyContent: 'space-between'
      }
    ]}>
      <View>

        <View style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            width: 50,
            height: 50,
            borderRadius: .5*50,
            backgroundColor: BaseColors.primary,
            marginInline: 'auto',
            marginBottom: BasePaddingsMargins.m10
          }
        ]}>
          <Text style={[
            StyleZ.h3,
            {
              margin: 0,
              marginBlockEnd: 0,
              marginBottom: 0,
              padding: 0,
              marginBlock:0,
              textAlign: 'center',
              color: BaseColors.light,
              
            }
          ]}>{ DirectorInitials(director)}</Text>
        </View>

        <Text style={[
          StyleZ.h4,
          {
            textAlign: 'center'
          }
        ]}>{
          DirectorName(director)
        }</Text>
        <Text style={[
          StyleZ.p,
          {
            textAlign: 'center'
          }
        ]}>{director.email}</Text>
        <Text style={[
          StyleZ.h3,
          {
            marginBottom: 0,
            textAlign: 'center'
          }
        ]}>ID: {director.id_auto}</Text>
      </View>

      <View style={[
        {
          paddingTop: BasePaddingsMargins.m25
        }
      ]}>
        <View>
          {
            type==='add-director'
            ?
            <>
              <LFButton 
              type="primary"
              label="Add The Director"
              icon="person-add"
              size="small"
              StyleProp={[
                (ids_adding_director.indexOf(director.id_auto) !== -1?{display: 'none'}:{})
              ]}
              onPress={()=>{

                ___AddDirector( director.id_auto )
                // ids_adding_director();
                ids_adding_director.push( director.id_auto );
                set_ids_adding_director([...ids_adding_director]);

                AfterChangeTheDirectors()

              }}
              />
              {
                ids_adding_director.indexOf(director.id_auto) !== -1
                ?
                <Text style={[
                  StyleZ.p,
                  {
                    textAlign: 'center'
                  }
                ]}>Director Is Added</Text>
                :
                null
              }
            </>
            :
            <>
            <LFButton 
              type="danger"
              label="Remove The Director"
              icon="person-remove"
              size="small"
              StyleProp={[
                (ids_removed_directors.indexOf(director.id_auto) !== -1?{display: 'none'}:{})
              ]}
              onPress={()=>{
                // ___RemoveDirector( director.id_auto );
                // AfterChangeTheDirectors()
                set_showQuestionMessage(true)
                set_directorForRemoving(director)
              }}
              />
              {
                ids_removed_directors.indexOf(director.id_auto) !== -1
                ?
                <Text style={[
                  StyleZ.p,
                  {
                    textAlign: 'center'
                  }
                ]}>Director Is Removed</Text>
                :
                null
              }
            </>
          }
        </View>
        <View></View>
      </View>

    </View>
  </UIPanel>;
}