import { Text, View } from "react-native";
import UIPanel from "../../../../components/UI/UIPanel";
import { StyleZ } from "../../../../assets/css/styles";
import { BaseColors, BasePaddingsMargins } from "../../../../hooks/Template";
import LFButton from "../../../../components/LoginForms/Button/LFButton";
import { useContextAuth } from "../../../../context/ContextAuth";
import { useEffect, useState } from "react";
import { ICAUserData } from "../../../../hooks/InterfacesGlobal";
import { AddDirectorToMyVenues, FetchMyDirectors, FetchPotentialDirectors, RemoveDirector } from "../../../../ApiSupabase/CrudUser";
import LFInput from "../../../../components/LoginForms/LFInput";
import ModalInfoMessage from "../../../../components/UI/UIModal/ModalInfoMessage";
import ItemDirectorAddRemove from "./ItemDirectorAddRemove";

export default function ModalEditDirectorsDirectorsList(


  {
    type,
    AfterChangeTheDirectors
  }
  :
  {
    type: 'add-director' | 'remove-director',
    AfterChangeTheDirectors: ()=>void
  }


){


  
  const {
    user
  } = useContextAuth();

  const [showQuestionMessage, set_showQuestionMessage] = useState<boolean>(false);
  const [directorForRemoving, set_directorForRemoving] = useState<ICAUserData | null>(null)

  const [directors, set_directors] = useState<ICAUserData[]>([]);
  const [ids_adding_director, set_ids_adding_director] = useState<number[]>([]);
  const [ids_removed_directors, set_ids_removed_directors] = useState<number[]>([]);


  const [search, set_search] = useState('');


  const ___loadPotentialDirectors = async ()=>{
    if(user===null)return;
    const {
      dataPotentialDirectors,
      dataPotentialDirectorsError
    } = await FetchPotentialDirectors( user.id_auto, search );
    if(dataPotentialDirectors){
      set_directors( dataPotentialDirectors as ICAUserData[] )
    }

    // // // console.log('dataPotentialDirectors:', dataPotentialDirectors);
    // // // console.log('dataPotentialDirectorsError:', dataPotentialDirectorsError);

  }

  const ___LoadTheDirectors = async ()=>{
    if(user===null)return;

    const {
      data,
      error
    } = await FetchMyDirectors( user.id_auto, search );

    set_directors( data as ICAUserData[] )

  }

  const ___LoadDirectorsGlobal = ()=>{
    
    if(type==='add-director'){
      ___loadPotentialDirectors();
    }
    else if(type==='remove-director'){
      ___LoadTheDirectors();
    }

  }

  useEffect(()=>{
    ___LoadDirectorsGlobal(  );
  }, [  ]);


  const ___AddDirector = async ( userIdThatNeedPermission:number )=>{
    if(user===null)return;
    const {
      data,
      error
    } = await AddDirectorToMyVenues(
      userIdThatNeedPermission,
      user.id_auto
    );
  }

  const ___RemoveDirector = async ( directorId:number ) => {

    if(user===null)return;

    const {
      data, error
    } = await RemoveDirector( user.id_auto, directorId );

    // const newIdsRemoved:number[]= ids_removed_directors.splice(ids_removed_directors.indexOf(directorId), 1);
    ids_removed_directors.push( directorId );
    set_ids_removed_directors( [...ids_removed_directors] );

    // // // console.log('data after removing director: ', data);
    // // // console.log('error after removing director: ', error);

  }

  useEffect(()=>{
    
    const handler = setTimeout(() => {
      
      // // // console.log('Searching...');
      // setDebouncedSearchTerm(searchTerm);
      ___LoadDirectorsGlobal(  );

    }, 500); // 500ms debounce delay

    return ()=>{
      clearTimeout( handler );
    }

  }, [
    search
  ])


  return <>

  <LFInput iconFront="search" label="Search Directors"  placeholder="Enter search text" onChangeText={(text: string)=>{
    set_search( text );
  }} />

  {/*<Text style={[
    StyleZ.p, 
    {
      color: 'yellow'
    }
  ]}>{ids_removed_directors.join(',')}</Text>*/}
    {
                directors.map((director: ICAUserData, key: number)=>{
                  return <ItemDirectorAddRemove 
                    key={`director-${key}`}
                    type={type}
                    director={director}
                    style={[
                      key===directors.length-1?{marginBottom: 0}:{}
                    ]}
                    ___AddDirector={___AddDirector}
                    ids_adding_director={ids_adding_director}
                    set_ids_adding_director={set_ids_adding_director}
                    AfterChangeTheDirectors={AfterChangeTheDirectors}
                    ids_removed_directors={ids_removed_directors}
                    set_showQuestionMessage={set_showQuestionMessage}
                    set_directorForRemoving={set_directorForRemoving}
                    />
                })
              }
  
  <ModalInfoMessage 
    title="Remove Tournament Director" 
    message="Are you sure you want to remove this tournament director from your venue? They will no longer be able to manage tournaments for your location."
    id={10}
    visible={showQuestionMessage}
    buttons={[
      <LFButton type="primary" label="Remove" onPress={()=>{
        set_showQuestionMessage(false);

        if(directorForRemoving!==null){

          ___RemoveDirector( directorForRemoving.id_auto );
          AfterChangeTheDirectors()
        }


      }} />,
      <LFButton type="outline-dark" label="Cancel" onPress={()=>{
        set_showQuestionMessage(false);
      }} />
    ]}
    />

  </>
}