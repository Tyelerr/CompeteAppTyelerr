import { Text, View } from "react-native";
import LFInput from "../../../components/LoginForms/LFInput";
import { StyleZ } from "../../../assets/css/styles";
import { BaseColors, BasePaddingsMargins } from "../../../hooks/Template";
import { ICAUserData } from "../../../hooks/InterfacesGlobal";
import { useEffect, useState } from "react";
import { FetchMyDirectors, FetchPotentialDirectors } from "../../../ApiSupabase/CrudUser";
import AddRemoveDirectorsGlobalListItem from "./AddRemoveDirectorsGlobalListItem";

export default function AddRemoveDirectorsGlobalList(
  {
    barOwner
  }
  :
  {
    barOwner: ICAUserData
  }
){

  const [barOwnerDirectors, set_barOwnerDirectors] = useState<ICAUserData[]>([]);
  const [potentialDirectors, set_potentialDirectors] = useState<ICAUserData[]>([]);
  const [search, set_search] = useState<string>("");

  const __LoadTheDirectors = async ()=>{
    // this function will load the directors attached to bar owners, also will load the potential directors after, one big list

    
    const {
      data,
      error
    } = await FetchMyDirectors( barOwner.id_auto, search );

    set_barOwnerDirectors( data as ICAUserData[] )

    const {
      dataPotentialDirectors,
      dataPotentialDirectorsError
    } = await FetchPotentialDirectors( barOwner.id_auto, search );
    if(dataPotentialDirectors){
      set_potentialDirectors( dataPotentialDirectors as ICAUserData[] )
    }


  }


  useEffect(()=>{
    __LoadTheDirectors();
  }, []);

  useEffect(()=>{
    
    const handler = setTimeout(() => {
      
      // // // console.log('Searching...');
      // setDebouncedSearchTerm(searchTerm);
      __LoadTheDirectors(  );

    }, 500); // 500ms debounce delay

    return ()=>{
      clearTimeout( handler );
    }
  }, [search]);

  return <View>

    
    <Text style={[
      
      StyleZ.h2,
      {
        color: BaseColors.light,
        paddingTop: BasePaddingsMargins.m40
      }
    ]}>Tournament Directors For User With ID: {barOwner.id_auto}</Text>

    <Text style={[
      StyleZ.p,
      {
        marginBottom: BasePaddingsMargins.formInputMarginLess
      }
    ]}>
      Tournament directors who can manage tournaments for the user with ID: {barOwner.id_auto}.
    </Text>

    <LFInput iconFront="search" label="Search Directors"  placeholder="Enter search text" onChangeText={(text: string)=>{
      set_search( text );
    }} />


    <View>
      {
        barOwnerDirectors.map((director: ICAUserData, key: number)=>{
          return <AddRemoveDirectorsGlobalListItem 
            key={`bar-owner-director-${director.id_auto}-${key}`}
            typeDirector="added"
            barOwner={barOwner}
            director={director}
            AfterChangeTheDirectors={()=>{
              __LoadTheDirectors()
            }}
          />
        })
      }
      {
        potentialDirectors.map((director: ICAUserData, key: number)=>{
          return <AddRemoveDirectorsGlobalListItem 
            key={`potential-director-${director.id_auto}-${key}`}
            typeDirector="potential"
            barOwner={barOwner}
            director={director}
            AfterChangeTheDirectors={()=>{
              __LoadTheDirectors()
            }}
          />
        })
      }
    </View>



  </View>
}