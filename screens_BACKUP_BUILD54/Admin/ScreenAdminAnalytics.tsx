import { Text, View } from "react-native";
import ScreenScrollView from "../ScreenScrollView";
import ScreenAdminDropdownNavigation from "./ScreenAdminDropdownNavigation";
import UIPanel from "../../components/UI/UIPanel";
import { StyleProgress, StyleTournamentAnalytics, StyleZ } from "../../assets/css/styles";
import { Fontisto, Ionicons } from "@expo/vector-icons";
import AnalyticsPanelAdmin from "./AnalyticsPanelAdmin";
import { BaseColors, BasePaddingsMargins, TextsSizes } from "../../hooks/Template";
import { useEffect, useState } from "react";
import { FetchTournamentsAnalytics, FetchTournamentsEventsAnalytics } from "../../ApiSupabase/CrudTournament";
import { useContextAuth } from "../../context/ContextAuth";
import { IAnalytics, IAnalyticsEventsRow, ICAUserData, IVenue } from "../../hooks/InterfacesGlobal";
import { FetchVenues } from "../../ApiSupabase/CrudVenues";
import ModalEditMyDirectors from "./modals/ModalEditMyDirectors/ModalEditMyDirectors";
import ModalAddDirector from "./modals/ModalEditMyDirectors/ModalAddDirector";
import { FetchMyDirectors } from "../../ApiSupabase/CrudUser";

export default function ScreenAdminAnalytics(){

  const {
    user
  } = useContextAuth();


  const [modalEditDirectories, set_modalEditDirectories] = useState<boolean>(false);
  
  const [modalAddDirectorIsOPened, set_modalAddDirectorIsOPened] = useState<boolean>(false);

  const [myTournaments, set_myTournaments] = useState<string>('0');
  const [activeEvents, set_activeEvents] = useState<string>('0');
  const [pendingApproval, set_pendingApproval] = useState<string>('0');
  const [myDirectors, set_myDirectors] = useState<string>('0');
  const [dataVenuesState, set_dataVenuesState] = useState<IVenue[]>([]);
  const [dataAnalyticsPerVenue, set_dataAnalyticsPerVenue] = useState<{
    analitics: IAnalytics,
    venue: IVenue
  }[]>([]);

  const [analyticsEvents, set_analyticsEvents] = useState<IAnalyticsEventsRow[]>([]);
  const [analyticsEventsTotalCount, set_analyticsEventsTotalCount] = useState<number>(0);

  const __LoadTheAnalytics = async ()=>{

    if (user===null)return;

    const {
      data,
      error
    } = await FetchTournamentsAnalytics( user as ICAUserData );

    // // // // // // // // console.log('data analytics:', data);
    // // // // // // // // console.log('error analytics:', error);

    if(error===null){
      const analytics: IAnalytics = data[0] as IAnalytics;
      set_myTournaments( analytics.my_tournaments.toString() );
      set_activeEvents( analytics.active_events.toString() );
      set_pendingApproval( analytics.pending_approval.toString() );
      set_myDirectors( analytics.my_directors.toString() );
    }
    else{}


    const { eventsData, eventsError } = await FetchTournamentsEventsAnalytics( user as ICAUserData );
    if(eventsError===null){
      const newEventsAnalytics: IAnalyticsEventsRow[] = [];
      let _totalAnalyticsCount:number = 0;
      for(let i=0;i<eventsData.length;i++){
        const _AnalyticsEventsRow:IAnalyticsEventsRow = eventsData[i] as IAnalyticsEventsRow;
        _totalAnalyticsCount+=_AnalyticsEventsRow.tournament_count;
        newEventsAnalytics.push( _AnalyticsEventsRow );
      }
      set_analyticsEventsTotalCount( _totalAnalyticsCount );
      set_analyticsEvents( newEventsAnalytics );
    }
    else{}



    const { data: dataVenuesRaw, error: errorVenues } = await FetchVenues(user.id_auto);

    const dataVenues: IVenue[] = dataVenuesRaw as IVenue[];
    const AnaliticsForVenueNew: {
      analitics: IAnalytics,
      venue: IVenue
    }[] = [];
    for(let i=0;i<dataVenues.length;i++){
      const {
        data: dataByVenueRaw,
        error: errorByVenue
      } = await FetchTournamentsAnalytics( user as ICAUserData, dataVenues[i].id );

      // // // // console.log(dataByVenueRaw, errorByVenue);

      if(dataByVenueRaw){
        const dataByVenue:IAnalytics = dataByVenueRaw[0] as IAnalytics;
        AnaliticsForVenueNew.push({
          analitics: dataByVenue,
          venue: dataVenues[i]
        })
      }

    }
    // // // // console.log('AnaliticsForVenueNew:', AnaliticsForVenueNew);
    set_dataAnalyticsPerVenue( AnaliticsForVenueNew );


  }

  useEffect(()=>{
    __LoadTheAnalytics();
  }, []);



  const [directors, set_directors] = useState<ICAUserData[]>([]);
  const __LoadTheDirectors = async ()=>{
    if(user===null)return;
    const {
      data, error
    } = await FetchMyDirectors(user?.id_auto);

    set_directors( data as ICAUserData[] )

  }

  useEffect(()=>{
    __LoadTheDirectors()
  }, []);

  return <>
  <ScreenScrollView>
    
    <View>
      
      <ScreenAdminDropdownNavigation />

      <View style={StyleZ.hr} />

      
      <AnalyticsPanelAdmin icon="trophy" value={myTournaments} label="My Tournaments" iconColor={BaseColors.success} />

      {
        dataAnalyticsPerVenue.map((item:{
          analitics: IAnalytics,
          venue: IVenue
        }, key: number)=>{
          return <AnalyticsPanelAdmin key={`analitics-per-venue-${key}`} icon="trophy" value={item.analitics.my_tournaments.toString()} label={`Venue: ${item.venue.venue}`} iconColor={BaseColors.success} />
        })
      }


      <AnalyticsPanelAdmin icon="checkmark" value={activeEvents} label="Active Events" iconColor={BaseColors.success} />
      <AnalyticsPanelAdmin icon="trophy" value={pendingApproval} label="Pending Approval" iconColor={BaseColors.warning} />
      <AnalyticsPanelAdmin 
        icon="calendar" 
        value={directors.length.toString()} 
        label="My Directors" 
        iconColor={BaseColors.primary}
        onPress={()=>{
          set_modalEditDirectories(true)
        }}
        />


      <UIPanel>
        <Text style={[
          StyleTournamentAnalytics.TitleAnalyiticsBig
        ]}>Event Types</Text>
        {
          analyticsEvents.map((ARow:IAnalyticsEventsRow, key:number)=>{
            return <View key={`analytics-row-events-${key}`} style={[
              {
                flexDirection: 'row',
                alignItems:  'center',
                justifyContent: 'space-between',
                marginBottom: (key<analyticsEvents.length-1?BasePaddingsMargins.formInputMarginLess:0)
              }
            ]}>
              <View style={{
                width: '40%'
              }}>
                <Text style={[
                  {
                    fontSize: TextsSizes.p,
                    color: BaseColors.light
                  }
                ]}>{ARow.tournament_type}</Text>
              </View>
              <View style={{width: `58%`, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <View style={[
                  StyleProgress.container,
                  {width: '65%'}
                ]}>
                  <View style={[
                    StyleProgress.progress,
                    {
                      width: `${100*ARow.tournament_count/(analyticsEventsTotalCount!==0?analyticsEventsTotalCount:0)}%`
                    }
                  ]} />
                </View>
                <View style={[
                  {width: '30%'}
                ]}>
                  <Text style={[
                    {
                      color: BaseColors.light,
                      textAlign: 'right',
                      fontSize: TextsSizes.p
                    }
                  ]}>{ARow.tournament_count}</Text>
                </View>
              </View>
            </View>
          })
        }
      </UIPanel>

      <UIPanel>
        <Text style={[
          StyleTournamentAnalytics.TitleAnalyiticsBig
        ]}>Venue Performance</Text>

        <View style={StyleTournamentAnalytics.ItemTexts}>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell1
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Title
            ]}>Monthly Events</Text>
          </View>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell2
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Value
            ]}>12</Text>
          </View>
        </View>

        
        <View style={StyleTournamentAnalytics.ItemTexts}>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell1
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Title
            ]}>Success Rate</Text>
          </View>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell2
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Value
            ]}>92%</Text>
          </View>
        </View>

        
        <View style={[
          StyleTournamentAnalytics.ItemTexts,
          {
            marginBottom: 0
          }
        ]}>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell1
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Title
            ]}>Active Directors</Text>
          </View>
          <View style={
            StyleTournamentAnalytics.ItemTexts_Cell2
          }>
            <Text style={[
              StyleTournamentAnalytics.ItemTexts_Value
            ]}>{directors.length}</Text>
          </View>
        </View>

      </UIPanel>


    </View>

  </ScreenScrollView>
  {
    modalEditDirectories===true?
      <ModalEditMyDirectors 
        F_isOpened={set_modalEditDirectories}
        isOpened={modalEditDirectories}
        onPressAddNewDirector={()=>{
          set_modalEditDirectories(false)
          set_modalAddDirectorIsOPened(true)
        }}
        AfterChangeTheDirectors={()=>{

          __LoadTheDirectors()

        }}
      />
      :
      null
  }

  {
    modalAddDirectorIsOPened===true?
      <ModalAddDirector
      F_isOpened={set_modalAddDirectorIsOPened}
      isOpened={modalAddDirectorIsOPened}
      AfterChangeTheDirectors={()=>{
        
        __LoadTheDirectors()

      }}
    />
    :
    null
  }

  </>
}