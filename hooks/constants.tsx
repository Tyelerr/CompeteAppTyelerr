import { EIGameTypes } from './InterfacesGlobal';

export const TIMEOUT_DELAY_WHEN_SEARCH: number = 300;

export const COUNT_TOURNAMENTS_IN_PAGE: number = 20;

export const THUMBNAIL_CUSTOM = 'custom';

// Geoapify API Configuration
export const GEOAPIFY_API_KEY = '565afe04bae14c469a4095cf5fd7b9af';
export const GEOAPIFY_BASE_URL = 'https://api.geoapify.com/v1';

export const tournament_thumb_8_ball = require('./../assets/images/thumbnails/8-ball-custom.jpg');
export const tournament_thumb_9_ball = require('./../assets/images/thumbnails/9-ball-custom.jpg');
export const tournament_thumb_10_ball = require('./../assets/images/thumbnails/10-ball-custom.jpg');
export const tournament_thumb_one_pocket = require('./../assets/images/thumbnails/10-ball-custom.jpg');
export const tournament_thumb_straight_pool = require('./../assets/images/thumbnails/10-ball-custom.jpg');
export const tournament_thumb_bank_pool = require('./../assets/images/thumbnails/10-ball-custom.jpg');

export const getThurnamentStaticThumb = (gameType: string) => {
  if (gameType === EIGameTypes.Ball8) return tournament_thumb_8_ball;
  else if (gameType === EIGameTypes.Ball9) return tournament_thumb_9_ball;
  else if (gameType === EIGameTypes.Ball10) return tournament_thumb_10_ball;
  else if (gameType === EIGameTypes.OnePocket)
    return tournament_thumb_one_pocket;
  else if (gameType === EIGameTypes.StraightPool)
    return tournament_thumb_straight_pool;
  else if (gameType === EIGameTypes.BankPool) return tournament_thumb_bank_pool;
  return null;
};

export const fargo_rated_tournaments_thumb = require('./../assets/images/thumbnails/fargo-rated-tournaments.jpg');

// US States for dropdown selection
export const US_STATES = [
  { label: 'Alabama', value: 'Alabama' },
  { label: 'Alaska', value: 'Alaska' },
  { label: 'Arizona', value: 'Arizona' },
  { label: 'Arkansas', value: 'Arkansas' },
  { label: 'California', value: 'California' },
  { label: 'Colorado', value: 'Colorado' },
  { label: 'Connecticut', value: 'Connecticut' },
  { label: 'Delaware', value: 'Delaware' },
  { label: 'Florida', value: 'Florida' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Hawaii', value: 'Hawaii' },
  { label: 'Idaho', value: 'Idaho' },
  { label: 'Illinois', value: 'Illinois' },
  { label: 'Indiana', value: 'Indiana' },
  { label: 'Iowa', value: 'Iowa' },
  { label: 'Kansas', value: 'Kansas' },
  { label: 'Kentucky', value: 'Kentucky' },
  { label: 'Louisiana', value: 'Louisiana' },
  { label: 'Maine', value: 'Maine' },
  { label: 'Maryland', value: 'Maryland' },
  { label: 'Massachusetts', value: 'Massachusetts' },
  { label: 'Michigan', value: 'Michigan' },
  { label: 'Minnesota', value: 'Minnesota' },
  { label: 'Mississippi', value: 'Mississippi' },
  { label: 'Missouri', value: 'Missouri' },
  { label: 'Montana', value: 'Montana' },
  { label: 'Nebraska', value: 'Nebraska' },
  { label: 'Nevada', value: 'Nevada' },
  { label: 'New Hampshire', value: 'New Hampshire' },
  { label: 'New Jersey', value: 'New Jersey' },
  { label: 'New Mexico', value: 'New Mexico' },
  { label: 'New York', value: 'New York' },
  { label: 'North Carolina', value: 'North Carolina' },
  { label: 'North Dakota', value: 'North Dakota' },
  { label: 'Ohio', value: 'Ohio' },
  { label: 'Oklahoma', value: 'Oklahoma' },
  { label: 'Oregon', value: 'Oregon' },
  { label: 'Pennsylvania', value: 'Pennsylvania' },
  { label: 'Rhode Island', value: 'Rhode Island' },
  { label: 'South Carolina', value: 'South Carolina' },
  { label: 'South Dakota', value: 'South Dakota' },
  { label: 'Tennessee', value: 'Tennessee' },
  { label: 'Texas', value: 'Texas' },
  { label: 'Utah', value: 'Utah' },
  { label: 'Vermont', value: 'Vermont' },
  { label: 'Virginia', value: 'Virginia' },
  { label: 'Washington', value: 'Washington' },
  { label: 'West Virginia', value: 'West Virginia' },
  { label: 'Wisconsin', value: 'Wisconsin' },
  { label: 'Wyoming', value: 'Wyoming' },
  { label: 'District of Columbia', value: 'District of Columbia' },
];
