/**
 * F12: things to compare a lifted total with on a share card ("≈ 3 hippos"). Each weight is a
 * published figure; living things use a typical adult, not a record. The note says where it
 * comes from. `unit` pins gym kit to the person's unit, so an lb lifter sees 45 lb plates.
 */
import type { LoadUnit } from '@/core/models';

export interface WeightThing {
  id: string;
  one: string;
  many: string;
  kg: number;
  group: 'gym' | 'animal' | 'dinosaur' | 'vehicle' | 'space' | 'landmark' | 'object';
  unit?: LoadUnit;
  note: string;
}

export const WEIGHT_THINGS: WeightThing[] = [
  // Gym kit, in the lifter's own unit
  { id: 'plate-25kg', one: 'red 25 kg plate', many: 'red 25 kg plates', kg: 25, group: 'gym', unit: 'kg', note: 'IWF-standard bumper plate' },
  { id: 'plate-45lb', one: '45 lb plate', many: '45 lb plates', kg: 20.412, group: 'gym', unit: 'lb', note: '45 lb × 0.4536' },
  { id: 'barbell-20kg', one: 'Olympic barbell', many: 'Olympic barbells', kg: 20, group: 'gym', unit: 'kg', note: "IWF men's bar, 20 kg" },
  { id: 'barbell-45lb', one: '45 lb barbell', many: '45 lb barbells', kg: 20.412, group: 'gym', unit: 'lb', note: '45 lb × 0.4536' },
  { id: 'gold-bar', one: 'gold bar', many: 'gold bars', kg: 12.4, group: 'object', note: 'London Good Delivery bar, about 400 troy oz' },
  // Animals (typical adults)
  { id: 'giant-panda', one: 'giant panda', many: 'giant pandas', kg: 100, group: 'animal', note: 'adult male, about 100 kg' },
  { id: 'lion', one: 'lion', many: 'lions', kg: 190, group: 'animal', note: 'adult male, about 190 kg' },
  { id: 'polar-bear', one: 'polar bear', many: 'polar bears', kg: 450, group: 'animal', note: 'adult male, about 450 kg' },
  { id: 'horse', one: 'horse', many: 'horses', kg: 500, group: 'animal', note: 'riding horse, about 500 kg' },
  { id: 'dairy-cow', one: 'dairy cow', many: 'dairy cows', kg: 680, group: 'animal', note: 'Holstein cow, about 680 kg' },
  { id: 'giraffe', one: 'giraffe', many: 'giraffes', kg: 1_200, group: 'animal', note: 'adult male, about 1.2 t' },
  { id: 'hippo', one: 'hippo', many: 'hippos', kg: 1_500, group: 'animal', note: 'common hippo, about 1.5 t' },
  { id: 'white-rhino', one: 'white rhino', many: 'white rhinos', kg: 2_300, group: 'animal', note: 'adult, about 2.3 t' },
  { id: 'elephant', one: 'African elephant', many: 'African elephants', kg: 6_000, group: 'animal', note: 'adult bull, about 6 t' },
  { id: 'humpback', one: 'humpback whale', many: 'humpback whales', kg: 30_000, group: 'animal', note: 'adult, about 30 t' },
  { id: 'blue-whale', one: 'blue whale', many: 'blue whales', kg: 150_000, group: 'animal', note: 'adult, about 150 t' },
  // Dinosaurs
  { id: 't-rex', one: 'T. rex', many: 'T. rexes', kg: 8_000, group: 'dinosaur', note: 'large adult estimate, about 8 t' },
  // Vehicles
  { id: 'small-car', one: 'small car', many: 'small cars', kg: 1_500, group: 'vehicle', note: 'kerb weight, about 1.5 t' },
  { id: 'school-bus', one: 'school bus', many: 'school buses', kg: 11_000, group: 'vehicle', note: 'full-size, empty, about 11 t' },
  { id: 'double-decker', one: 'double-decker bus', many: 'double-decker buses', kg: 12_000, group: 'vehicle', note: 'empty, about 12 t' },
  { id: 'boeing-737', one: 'Boeing 737 (empty)', many: 'Boeing 737s (empty)', kg: 41_400, group: 'vehicle', note: '737-800 operating empty weight, 41.4 t' },
  { id: 'battle-tank', one: 'battle tank', many: 'battle tanks', kg: 62_000, group: 'vehicle', note: 'M1A2 Abrams, about 62 t' },
  { id: 'a380', one: 'Airbus A380 (empty)', many: 'Airbus A380s (empty)', kg: 277_000, group: 'vehicle', note: 'operating empty weight, 277 t' },
  // Space
  { id: 'curiosity', one: 'Curiosity Mars rover', many: 'Curiosity Mars rovers', kg: 899, group: 'space', note: 'NASA: 899 kg' },
  { id: 'hubble', one: 'Hubble Space Telescope', many: 'Hubble Space Telescopes', kg: 11_110, group: 'space', note: 'NASA: 11,110 kg at launch' },
  { id: 'space-shuttle', one: 'Space Shuttle orbiter', many: 'Space Shuttle orbiters', kg: 78_000, group: 'space', note: 'empty orbiter, about 78 t' },
  { id: 'iss', one: 'International Space Station', many: 'International Space Stations', kg: 420_000, group: 'space', note: 'NASA: about 420 t' },
  // Landmarks and famous objects
  { id: 'grand-piano', one: 'concert grand piano', many: 'concert grand pianos', kg: 480, group: 'object', note: 'Steinway Model D, about 480 kg' },
  { id: 'liberty-bell', one: 'Liberty Bell', many: 'Liberty Bells', kg: 943, group: 'landmark', note: '2,080 lb' },
  { id: 'big-ben', one: 'Big Ben bell', many: 'Big Ben bells', kg: 13_760, group: 'landmark', note: 'the Great Bell, 13.76 t' },
  { id: 'stonehenge', one: 'Stonehenge sarsen', many: 'Stonehenge sarsens', kg: 25_000, group: 'landmark', note: 'average sarsen stone, about 25 t' },
  { id: 'statue-of-liberty', one: 'Statue of Liberty', many: 'Statues of Liberty', kg: 204_000, group: 'landmark', note: 'NPS: 450,000 lb' },
  { id: 'eiffel-tower', one: 'Eiffel Tower', many: 'Eiffel Towers', kg: 10_100_000, group: 'landmark', note: 'whole tower, 10,100 t' },
];
