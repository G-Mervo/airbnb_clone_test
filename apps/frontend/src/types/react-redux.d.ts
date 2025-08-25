import 'react-redux';
import type { RootState } from '../redux/Store';

declare module 'react-redux' {
  // Infer the `state` type for `useSelector` when no generic is provided
  interface DefaultRootState extends RootState {}
}


