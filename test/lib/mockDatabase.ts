import { init } from './seedDatabase';

const random = true;

init({ random }).then((_data) => {
  console.log('Database filled with data');
});
