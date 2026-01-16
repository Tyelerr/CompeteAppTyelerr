import { Image, Text, TouchableOpacity, View } from "react-native"
import { StyleTournamentsAdmin, StyleZ } from "../../assets/css/styles"
import UIPanel from "../../components/UI/UIPanel"
import { ETournamentStatuses, EUserRole, ITournament } from "../../hooks/InterfacesGlobal"
import { getThurnamentStaticThumb, THUMBNAIL_CUSTOM } from "../../hooks/constants"
import UIBadge from "../../components/UI/UIBadge"
import { BaseColors, BasePaddingsMargins } from "../../hooks/Template"
import LFButton from "../../components/LoginForms/Button/LFButton"
import { UpdateTournament } from "../../ApiSupabase/CrudTournament"
import { useContextAuth } from "../../context/ContextAuth"
import { useEffect, useState } from "react"
import ScreenBilliardModalTournament from "../Billiard/ScreenBilliardModalTournament"

export default function TournamentThumbnailAdmin(
  {
    tournament,
    reloadTheTournaments
  }
  :
  {
    tournament: ITournament,
    reloadTheTournaments?: ()=>void
  }
  ){

  
  const {
    user
  } = useContextAuth();

  const [modalForTournamentIsOpened, set_modalForTournamentIsOpened] = useState<boolean>(false);
  const [selectedTournamentForTheModal, set_selectedTournamentForTheModal] = useState<ITournament | null>(null);

  // const [statusOverwrite, set_statusOverwrite] = usest

  const ___ApproveTournament = async ()=>{

    // // console.log('tournament for editing: ', tournament);

    const {data, error} = await UpdateTournament( tournament, {status:ETournamentStatuses.Approved} );
    

    // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if(reloadTheTournaments!==undefined){
      // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  }
  const ___MakePendingTournament = async ()=>{

    // // console.log('tournament for editing: ', tournament);

    const {data, error} = await UpdateTournament( tournament, {status:ETournamentStatuses.Pending} );

    // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if(reloadTheTournaments!==undefined){
      // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  }
  
  const ___DeleteTournament = async ()=>{

    // // console.log('tournament for editing: ', tournament);

    const {data, error} = await UpdateTournament( tournament, {status:ETournamentStatuses.Deleted} );

    // // console.log('reloadTheTournaments function: ', reloadTheTournaments);

    if(reloadTheTournaments!==undefined){
      // // console.log('Reloading the tournaments');
      reloadTheTournaments();
    }
  }

  useEffect(()=>{
    // // console.log('loggeduser: ', user);
  }, []);
  
  return <><UIPanel>
    <View style={{
      position: 'relative'
    }}>
      <TouchableOpacity onPress={()=>{
        set_selectedTournamentForTheModal(tournament);
        set_modalForTournamentIsOpened(true);
      }}>
      {
        tournament.thumbnail_type === THUMBNAIL_CUSTOM?
        <Image
          style={[
            StyleTournamentsAdmin.image,
            // {opacity: 0}
          ]} 
          source={{uri: tournament.thumbnail_url}} />
        :
        (
          getThurnamentStaticThumb(tournament.thumbnail_type)!==null
          ?
          <Image
            style={[
              StyleTournamentsAdmin.image
            ]}  
            source={getThurnamentStaticThumb(tournament.thumbnail_type)} />
          :
          null
        )
      }
      </TouchableOpacity>

      {
        user?.role===EUserRole.MasterAdministrator?
        <View style={{
          position: 'absolute',
          top: 10,
          right: 10,
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          {
            tournament.status===ETournamentStatuses.Pending
            ?
            <View style={{
              width: 120,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="Approve" type="success" size="small" onPress={()=>{
                ___ApproveTournament()
              }} />
            </View>
            :
            null
          }
          
          {
            tournament.status!==ETournamentStatuses.Deleted
            ?
            <View style={{
              width: 120,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="Delete" type="danger" size="small" onPress={()=>{
                ___DeleteTournament()
              }} />
            </View>
            :
            null
          }
          {
            tournament.status===ETournamentStatuses.Deleted
            ?
            <>
            <View style={{
              width: 120,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="Restore To Pending" type="dark" size="small" onPress={()=>{
                ___MakePendingTournament()
              }} />
            </View>
            <View style={{
              width: 120,
              marginLeft: BasePaddingsMargins.m10
            }}>
              <LFButton label="Restore To Approved" type="dark" size="small" onPress={()=>{
                ___ApproveTournament()
              }} />
            </View>
            </>
            :
            null
          }
        </View>
        :
        null
      }



    </View>
    <View>
      <Text style={[
        StyleTournamentsAdmin.title
      ]}>{tournament.tournament_name!==''?tournament.tournament_name:'-tournament name is missing-'}</Text>
    </View>
    <View style={StyleTournamentsAdmin.badgesHolder}>
      <View style={StyleTournamentsAdmin.badgeHolder}>
        <UIBadge type="secondary" label={tournament.game_type===''?'-not defined-':tournament.game_type} />
      </View>
      <View style={StyleTournamentsAdmin.badgeHolder}>
        <UIBadge label={`ID: ${tournament.id_unique_number}`} />
      </View>
    </View>
    <View>
      <Text style={[
        {
          color: BaseColors.othertexts
        }
      ]}>Tournament Date: {(new Date(tournament.start_date)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
      <Text style={StyleTournamentsAdmin.p}>
        Location: {tournament.venue}
      </Text>
      <Text style={StyleTournamentsAdmin.p}>
        Entry Fee: ${tournament.tournament_fee}
      </Text>
      <Text style={StyleTournamentsAdmin.p}>
        Player Count: 0
      </Text>
    </View>
    
    <View style={[
      StyleZ.hr,
      {
        marginBlock: BasePaddingsMargins.m15,
        marginBottom: BasePaddingsMargins.m15,
      }
    ]} />

    <View>
      <Text style={StyleTournamentsAdmin.p}>
        Tournament Director: {tournament.director_name}
      </Text>
      <Text style={StyleTournamentsAdmin.p}>
        Submitted by: {
          tournament.profiles!==null?
          tournament.profiles.email.split('@')[0]
          :
          '--undefined creator--'
        }
      </Text>
    </View>
  </UIPanel>


  {
    // selectedTournamentForTheModal!==null?
    modalForTournamentIsOpened===true && selectedTournamentForTheModal!==null?
    <ScreenBilliardModalTournament 
      F_isOpened={set_modalForTournamentIsOpened}
      isOpened={modalForTournamentIsOpened}
      tournament={selectedTournamentForTheModal}
    />
    :
    null
  }

  </>
}