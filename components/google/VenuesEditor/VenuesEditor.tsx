// working only when is logged

import { Text, View } from 'react-native';
import { useContextAuth } from '../../../context/ContextAuth';
import { StyleZ } from '../../../assets/css/styles';
import { BasePaddingsMargins } from '../../../hooks/Template';
import DirectPlaceSearch from '../GoogleSearchVenue';
import LFInput from '../../LoginForms/LFInput';
import LFButton from '../../LoginForms/Button/LFButton';
import ModalAddVenue from './ModalAddNewVenue';
import { useEffect, useState } from 'react';
import UIPanel from '../../UI/UIPanel';
import LFCheckBox from '../../LoginForms/LFCheckBox';
import { fetchVenues } from '../../../ApiSupabase/CrudVenues';
import { ICAUserData, IVenue } from '../../../hooks/InterfacesGlobal';

export default function VenuesEditor({
  sendBackTheValues,
  barOwner,
}: {
  sendBackTheValues?: (venue: IVenue) => void;
  barOwner: ICAUserData;
}) {
  const [modalShow, set_modalShow] = useState<boolean>(false);
  const [venues, set_venues] = useState<IVenue[]>([]);
  const [venuesOptions, set_venuesOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [checkedVenue, set_checkedVenue] = useState<IVenue | null>(null);
  // const [checkedVenueIndex, set_checkedVenueIndex] = useState<IVenue | null>(null);

  /*const {
    user
  } = useContextAuth();*/

  const ____LoadTheVenus = async () => {
    // if(user===null)return;
    const data = await fetchVenues();

    const newVenues: IVenue[] = data as IVenue[];
    const newVenuesOptions: { label: string; value: string }[] = [];
    set_venues(newVenues);
    for (let i = 0; i < newVenues.length; i++) {
      newVenuesOptions.push({
        label: newVenues[i].venue,
        value: newVenues[i].id.toString(),
      });
    }
    set_venuesOptions(newVenuesOptions);
  };

  /*const venuesOptions = [
    {
      label: 'Venue 1', value: "1",
    },
    {
      label: 'Venue 2', value: "2"
    }
  ];*/

  useEffect(() => {
    if (modalShow === true) return;
    ____LoadTheVenus();
  }, [modalShow]);

  useEffect(() => {
    if (checkedVenue === null || sendBackTheValues === undefined) return;
    sendBackTheValues(checkedVenue as IVenue);
  }, [checkedVenue]);

  // if(user===null)return null;

  return (
    <>
      <View>
        <View
          style={{
            marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
          }}
        >
          <Text
            style={[
              StyleZ.h4,
              {
                marginBottom: BasePaddingsMargins.loginFormInputHolderMargin,
              },
            ]}
          >
            Venue Information
          </Text>
        </View>

        {/* <LFInput 
        placeholder="Select Venue"
        typeInput="dropdown"
        items={venuesOptions}
      />*/}

        {
          // the list of the venues start
        }

        {
          // the client will say how to show this list after
          /*<View style={[
      {
        marginBottom: BasePaddingsMargins.loginFormInputHolderMargin
      }
    ]}>
        {
          venues.map((venue:IVenue, key:number)=>{
            return <View 
              key={`venue-item-${key}`}
              style={{marginBottom:BasePaddingsMargins.m10}}>
              <UIPanel size="for-calendar" >
                <LFCheckBox 
                  label={venue.venue} 
                  checked={checkedVenue!==null && venue.id===checkedVenue?.id}
                  onPress={()=>{
                    // // // // console.log(venue.id);
                    set_checkedVenue(venue)
                  }}
                  // subLabel="Venue Address"
                  type="default" 
                // checked={reportsToFargo} 
                // set_checked={set_reportsToFargo}
                  />
              </UIPanel>
            </View>
          })
        }
    </View>*/
        }
        {
          // the list of the venues ends
        }
      </View>

      <ModalAddVenue
        show={modalShow}
        showF={set_modalShow}
        barOwner={barOwner}
      />
    </>
  );
}
