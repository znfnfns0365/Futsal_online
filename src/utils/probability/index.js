export default function probability(a) {
  let c = 0;
  switch (a) {
    case 1:
      c = 81.6;
      break;
    case 2:
      c = 66.7;
      break;
    case 3:
      c = 54.4;
      break;
    case 4:
      c = 44.4;
      break;
    case 5:
      c = 36.3;
      break;
    case 6:
      c = 29.6;
      break;
    case 7:
      c = 24.2;
      break;
    case 8:
      c = 19.8;
      break;
    case 9:
      c = 16.1;
      break;
  }
  return c;
}

// import probability from './utils/probability/index.js';
