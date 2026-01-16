/**
 * View the pending tournaments
 */

import { Image, Text, View } from "react-native";
import ScreenScrollView from "../ScreenScrollView";
import ScreenAdminDropdownNavigation from "./ScreenAdminDropdownNavigation";
import UIPanel from "../../components/UI/UIPanel";
import { StyleTournamentsAdmin, StyleZ } from "../../assets/css/styles";
import LFInput from "../../components/LoginForms/LFInput";
import { ETournamentStatuses, GameTypes, ITournament, TournamentStatusesForDropdown } from "../../hooks/InterfacesGlobal";
import { useEffect, useRef, useState } from "react";
import { FetchTournaments, FetchTournaments2, FetchTournamentsVenues } from "../../ApiSupabase/CrudTournament";
import UIBadge from "../../components/UI/UIBadge";
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template";
import { getThurnamentStaticThumb, THUMBNAIL_CUSTOM, TIMEOUT_DELAY_WHEN_SEARCH } from "../../hooks/constants";
import LFButton from "../../components/LoginForms/Button/LFButton";
import TournamentThumbnailAdmin from "./TournamentThumbnailAdmin";
import AdminTournamentsList from "./AdminTournamentsList";
import AdminTournamentsFIlters, { IAdminTournamentsFilters } from "./AdminTournamentsFIlters";

export default function ScreenAdminPending(){

  /*const [tournamets, set_tournamets] = useState<ITournament[]>([]);
  const [searchingTerm, set_searchingTerm]  = useState<string>('');
  const [filterType, set_filterType] = useState<string>('');
  const [filterVenue, set_filterVenue] = useState<string>('');
  const [filterId, set_filterId] = useState<string>('');
  // i think this filter don't need, the reason is this page is only for pending tournaments
  const [filterStatus, set_filterStatus] = useState<string>('');

  const [itemsForVenues, set_itemsForVenues] = useState<{label:string, value:string}[]>([]);

  const [sortBy, set_sortBy] = useState<string>('start_date');
  const [sortTypeIsAsc, set_sortTypeIsAsc] = useState<boolean>(false);*/

  /*const _LoadTournaments = async ()=>{

    // // // // // // console.log('_LoadTournaments:', _LoadTournaments);

    const {
      data,
      error
    } = await FetchTournaments2( 
      searchingTerm, 
      filterType, 
      filterVenue,
      filterId,
      ETournamentStatuses.Pending, // this is for the status, here should be pending
      {
        sortBy: sortBy,
        sortTypeIsAsc: sortTypeIsAsc
      } 
    );


    // // // // // // // // // console.log('error:', error);
    // // // // // // // // // console.log('data:', data);

    const _tournamets_: ITournament[] = [];
    for(let i=0;i<data.length;i++){
      _tournamets_.push(data[i] as ITournament);
    }
    set_tournamets(_tournamets_);

    // // // // // // // // // // console.log('data:', data);



  }*/

  /*const _LoadTournamentsVenues = async ()=>{
    
    const {
      data, error
    } = await FetchTournamentsVenues();


    const dataFor: {label:string, value:string}[] = [
      
    ];
    for(let i=0;i<data.length;i++){
      dataFor.push({
        label: data[i].venue_name,
        value: data[i].venue_name
      });
    }

    // // // // // // // // // console.log( 'dataFor: ', dataFor );

    set_itemsForVenues( dataFor )

  }*/

  /*const debounceTimeout = useRef(null);

  useEffect(()=>{
    if(debounceTimeout.current){
      clearTimeout( debounceTimeout.current );
    }

   
    debounceTimeout.current = setTimeout(()=>{
       _LoadTournaments();
    }, TIMEOUT_DELAY_WHEN_SEARCH);

    return ()=>{
      clearTimeout( debounceTimeout.current )
    }
  }, [searchingTerm, filterType, filterVenue, filterId, sortBy, sortTypeIsAsc]);*/

  /*useEffect(()=>{
    _LoadTournamentsVenues();
  }, []);*/

  const [filters, set_filters] = useState<IAdminTournamentsFilters | null>(null);

  return <>
  <ScreenScrollView>

    <View>
      <ScreenAdminDropdownNavigation />
      
      <View style={[
        StyleZ.loginFromContainer,
      ]}>
        <View style={[
          StyleZ.loginForm
        ]}>

          {/*<LFInput 
            keyboardType="default"
            placeholder="Search tournaments..."
            iconFront="search"
            marginBottomInit={BasePaddingsMargins.formInputMarginLess}
            defaultValue={
              ""
            }
            onChangeText={(text:string)=>{
              // set_tournamentName(text);
              // setErrorForm('')
              // set_searchUsersTerm(text)
              set_searchingTerm( text );
            }}
            validations={[
              // EInputValidation.Required,
            ]}
            />

          <View style={[
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
                marginBottom: BasePaddingsMargins.formInputMarginLess
            }
          ]}>
            <View style={[
              {
                width: '48%'
              }
            ]}>
              <LFInput 
                typeInput="dropdown"
                placeholder="All Types"
                label="Filter By Type"
                marginBottomInit={0}
                defaultValue={
                  ""
                }
                onChangeText={(text:string)=>{
                  // set_tournamentName(text);
                  // setErrorForm('')
                  // set_searchUserRole(text)
                  set_filterType(text);
                }}
                validations={[
                  // EInputValidation.Required,
                ]}
                // items={[{label:'All Types', value:''}, ...GameTypes]}
                items={GameTypes}
                />
            </View>
            <View style={[
              {
                width: '48%'
              }
            ]}>
              <LFInput 
                label="Filter by ID"
                placeholder="ID Number"
                keyboardType="number-pad"
                marginBottomInit={0}
                onChangeText={(text)=>{
                  // set_searchIdNumber(text)
                  set_filterId(text)
                }}
                />
            </View>
            
          </View>
          <View style={[
            {
              width: '100%'
            }
          ]}>
            <LFInput 
              typeInput="dropdown"
              placeholder="All Venues"
              label="Venues"
              iconFront="pin"
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              defaultValue={
                ""
              }
              onChangeText={(text:string)=>{
                // set_tournamentName(text);
                // setErrorForm('')
                // set_searchUserRole(text)
                // set_filterType(text);
                set_filterVenue(text)
              }}
              validations={[
                // EInputValidation.Required,
              ]}
              items={itemsForVenues}
              />
          </View>
          <View style={[
            {
              width: '70%'
            }
          ]}>
            <LFInput 
              typeInput="dropdown"
              placeholder="Any Status"
              label="Status"
              iconFront="filter"
              marginBottomInit={BasePaddingsMargins.formInputMarginLess}
              defaultValue={
                ""
              }
              onChangeText={(text:string)=>{
                set_filterStatus(text)
              }}
              validations={[
                // EInputValidation.Required,
              ]}
              items={[
                // {label:'Any Status', value: ''}, 
                ...TournamentStatusesForDropdown
              ]}
              />
          </View>

          <View style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: BasePaddingsMargins.loginFormInputHolderMargin
          }}>
            <View style={{
              width: '50%',
              marginRight: BasePaddingsMargins.m10
            }}>
              <LFInput 
                typeInput="dropdown"
                placeholder="Default"
                label="Order By"
                marginBottomInit={1}
                defaultValue={
                  ""
                }
                onChangeText={(text:string)=>{
                  set_sortBy(text)
                }}
                validations={[
                  // EInputValidation.Required,
                ]}
                items={[
                  {label:'Date', value:'start_date'},
                  {label:'Title', value:'tournament_name'},
                  {label:'Venue', value:'venue'},
                  {label:'Entry Fee', value:'tournament_fee'},
                  {label:'Players', value:'number_of_tables'},
                ]}
                />
            </View>
            <View style={{
              width: 50
            }}>
              <LFButton label="" icon={sortTypeIsAsc===true?'arrow-down':'arrow-up'} type="outline-dark"  marginbottom={0} onPress={()=>{
                set_sortTypeIsAsc( !sortTypeIsAsc );
              }} />
            </View>
          </View>*/}


          <AdminTournamentsFIlters
            set_filters={set_filters}
            tournament_status_static_value={ETournamentStatuses.Pending}
          />

          
          <View style={[
            StyleZ.hr
          ]} />


          {
            /*tournamets.map((tournament: ITournament, key:number)=>{
              
              return <TournamentThumbnailAdmin 
                key={`tournament-thumb-${key}-${(new Date()).valueOf()}`} 
                tournament={tournament}
                reloadTheTournaments={_LoadTournaments}
                />

            })*/
          }  

          <AdminTournamentsList 
            // _LoadTournaments={_LoadTournaments}
            // tournamets={tournamets}
            filters={filters}
          />

        </View>
      </View>

    </View>


  </ScreenScrollView>
  </>
}
