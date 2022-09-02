import fakePersons from './_fakePersons.json';

export type Person = typeof fakePersons extends (infer T)[] ? T : never;

export default fakePersons;
