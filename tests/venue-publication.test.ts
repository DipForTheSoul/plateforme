import {it,expect} from 'vitest';
import {isVenuePublished} from '@/lib/venue-publication';
it('ne confond pas validation de l’adresse et publication de la fiche',()=>{
  expect(isVenuePublished({review_status:'approved',is_public:false})).toBe(false);
  expect(isVenuePublished({review_status:'pending',is_public:true})).toBe(false);
  expect(isVenuePublished({review_status:'approved',is_public:true})).toBe(true);
  expect(isVenuePublished({review_status:'approved'})).toBe(true);
});
